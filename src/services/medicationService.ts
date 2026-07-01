// src/services/medicationService.ts

// 복약 도메인 API.
//
// 백엔드 ↔ 프론트 변환:
//  - wardId (백) ↔ protegeId (프)
//  - "HH:mm:ss" (백 LocalTime) ↔ "HH:mm" (프)
//
// 허용 오차(early/delay)는 백엔드 기본값으로 보내고 응답은 무시.

import { api } from "./api";
import type {
  CreateMedicationScheduleInput,
  DayOfWeek,
  MedicationLog,
  MedicationLogSource,
  MedicationSchedule,
  MedicationScheduleType,
  MedicationSource,
  TakeMedicationInput,
  TodayMedicationSlot,
  UpdateMedicationScheduleInput,
} from "../types/medication";

// 허용 오차 기본값 (Medisafe 방식 — UI에는 노출 안 함)
const DEFAULT_ALLOWED_EARLY_MINUTES = 30;
const DEFAULT_ALLOWED_DELAY_MINUTES = 60;

// ────────────────────────────────────────────
// 시간 포맷 변환
// ────────────────────────────────────────────

/** "08:00:00" → "08:00" */
function toFrontTime(t: string): string {
  return t.slice(0, 5);
}

/** "08:00" → "08:00:00" */
function toBackendTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

// ────────────────────────────────────────────
// 백엔드 raw 응답 타입
// ────────────────────────────────────────────

interface MedicationScheduleResponseRaw {
  scheduleId: number;
  scheduleIds: number[];
  wardId: number;
  medicationName: string;
  scheduledTime: string;
  allowedEarlyMinutes: number;
  allowedDelayMinutes: number;
  scheduleType: MedicationScheduleType;
  dayOfWeek: DayOfWeek | null;
  daysOfWeek: DayOfWeek[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MedicationLogResponseRaw {
  logId: number;
  wardId: number;
  scheduleId: number | null;
  medicationName: string;
  takenAt: string;
  logSource: MedicationLogSource;
  createdAt: string;
}

// 봉지(DoseGroup) 계층 응답 — GET .../medication-schedules/source (4-1).
// 암호화 원천을 복호화해 groupId→봉지(시각)→성분 계층으로 반환한다.
interface MedicationGroupListRaw {
  groups: MedicationGroupRaw[];
}

interface MedicationGroupRaw {
  groupId: string;
  source: MedicationSource;
  medicationName: string | null; // AUTO는 null, MANUAL은 약명
  packets: MedicationPacketRaw[];
}

interface MedicationPacketRaw {
  scheduledTime: string; // "HH:mm:ss"
  label: string | null;
  scheduleType: MedicationScheduleType;
  daysOfWeek: DayOfWeek[];
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  items: MedicationItemRaw[];
}

interface MedicationItemRaw {
  scheduleId: number;
  name: string;
}

function toFrontSchedule(
  raw: MedicationScheduleResponseRaw,
): MedicationSchedule {
  return {
    id: raw.scheduleId,
    scheduleIds: raw.scheduleIds ?? [raw.scheduleId],
    protegeId: raw.wardId,
    medicationName: raw.medicationName,
    scheduledTime: toFrontTime(raw.scheduledTime),
    scheduleType: raw.scheduleType,
    daysOfWeek: raw.scheduleType === "DAILY" ? [] : raw.daysOfWeek ?? [],
    active: raw.active,
    createdAt: raw.createdAt,
  };
}

/**
 * 봉지 계층 응답 → 평면 MedicationSchedule[]로 펼침.
 * 각 (group, packet, item)이 한 row. groupId/source를 부착한다.
 * 이후 groupSchedules()로 다시 묶으면 기존 UI 모델(요일 union)이 그대로 복원된다.
 */
function flattenGroups(
  raw: MedicationGroupListRaw,
  protegeId: number,
): MedicationSchedule[] {
  const flat: MedicationSchedule[] = [];
  for (const group of raw.groups ?? []) {
    for (const packet of group.packets ?? []) {
      for (const item of packet.items ?? []) {
        flat.push({
          id: item.scheduleId,
          scheduleIds: [item.scheduleId],
          protegeId,
          medicationName: item.name,
          scheduledTime: toFrontTime(packet.scheduledTime),
          scheduleType: packet.scheduleType,
          daysOfWeek:
            packet.scheduleType === "DAILY" ? [] : packet.daysOfWeek ?? [],
          active: packet.active,
          createdAt: packet.startDate ?? "",
          startDate: packet.startDate ?? null,
          endDate: packet.endDate ?? null,
          groupId: group.groupId,
          source: group.source,
        });
      }
    }
  }
  return flat;
}

function toFrontLog(raw: MedicationLogResponseRaw): MedicationLog {
  return {
    id: raw.logId,
    protegeId: raw.wardId,
    scheduleId: raw.scheduleId,
    medicationName: raw.medicationName,
    takenAt: raw.takenAt,
    logSource: raw.logSource,
  };
}
// ────────────────────────────────────────────
// 같은 약(이름+시간+타입+active)인 schedule row들을 한 카드로 묶음.
// 백엔드는 요일마다 row를 분리해서 저장하지만 UI는 삼성 알람처럼
// "월,화" 한 카드로 보여주기 위함.
// 대표 id는 그룹 내 첫 schedule(가장 작은 scheduleId).
// ────────────────────────────────────────────

const DAY_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function groupSchedules(schedules: MedicationSchedule[]): MedicationSchedule[] {
  const groups = new Map<string, MedicationSchedule>();

  for (const s of schedules) {
    const key = `${s.medicationName}|${s.scheduledTime}|${s.scheduleType}|${s.active}`;
    const existing = groups.get(key);
    if (existing) {
      const merged = new Set([...existing.daysOfWeek, ...s.daysOfWeek]);
      groups.set(key, {
        ...existing,
        daysOfWeek: DAY_ORDER.filter((d) => merged.has(d)),
        scheduleIds: [...existing.scheduleIds, ...s.scheduleIds],
      });
    } else {
      groups.set(key, {
        ...s,
        daysOfWeek: [...s.daysOfWeek].sort(
          (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b),
        ),
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.scheduledTime.localeCompare(b.scheduledTime),
  );
}

// ────────────────────────────────────────────
// API: 복약 일정
// ────────────────────────────────────────────

/** GET /api/wards/{wardId}/medication-schedules/source — 복호화된 원본 데이터 */
/** GET /api/wards/{wardId}/medication-schedules/source — 복호화된 원본 데이터 */
export async function getMedicationSchedules(
  protegeId: number,
): Promise<MedicationSchedule[]> {
  const res = await api.get<MedicationGroupListRaw>(
    `/api/wards/${protegeId}/medication-schedules/source`,
  );
  const flat = flattenGroups(res.data, protegeId);
  return groupSchedules(flat);
}

// 오늘의 약(4-2) 응답
interface TodayMedicationSlotRaw {
  scheduledTime: string; // "HH:mm:ss"
  label: string | null;
  allTaken: boolean;
  items: {
    scheduleId: number;
    name: string;
    taken: boolean;
    takenAt: string | null;
  }[];
}

interface TodayMedicationRaw {
  slots: TodayMedicationSlotRaw[];
}

/** GET /api/wards/{wardId}/medication-schedules/today?date=YYYY-MM-DD (4-2) */
export async function getMedicationToday(
  protegeId: number,
  date: string,
): Promise<TodayMedicationSlot[]> {
  const res = await api.get<TodayMedicationRaw>(
    `/api/wards/${protegeId}/medication-schedules/today`,
    { params: { date } },
  );
  return (res.data.slots ?? []).map((slot) => ({
    scheduledTime: toFrontTime(slot.scheduledTime),
    label: slot.label,
    allTaken: slot.allTaken,
    items: (slot.items ?? []).map((it) => ({
      scheduleId: it.scheduleId,
      name: it.name,
      taken: it.taken,
      takenAt: it.takenAt,
    })),
  }));
}

/** GET /api/medications/schedules/{scheduleId} */
export async function getMedicationSchedule(
  scheduleId: number,
): Promise<MedicationSchedule> {
  const res = await api.get<MedicationScheduleResponseRaw>(
    `/api/medications/schedules/${scheduleId}`,
  );
  return toFrontSchedule(res.data);
}

/** POST /api/medications/schedules */
export async function createMedicationSchedule(
  input: CreateMedicationScheduleInput,
): Promise<MedicationSchedule> {
  const res = await api.post<MedicationScheduleResponseRaw>(
    "/api/medications/schedules",
    {
      wardId: input.protegeId,
      medicationName: input.medicationName,
      scheduledTime: toBackendTime(input.scheduledTime),
      allowedEarlyMinutes: DEFAULT_ALLOWED_EARLY_MINUTES,
      allowedDelayMinutes: DEFAULT_ALLOWED_DELAY_MINUTES,
      scheduleType: input.scheduleType,
      daysOfWeek: input.scheduleType === "WEEKLY" ? input.daysOfWeek : [],
      startDate: input.startDate ?? null, // ← 추가
      endDate: input.endDate ?? null, // ← 추가
    },
  );
  return toFrontSchedule(res.data);
}

/** PUT /api/medications/schedules/{scheduleId} */
// src/services/medicationService.ts — updateMedicationSchedule 함수만 교체

/** PUT /api/medications/schedules/{scheduleId} */
// src/services/medicationService.ts — updateMedicationSchedule 함수만 교체

/** PUT /api/medications/schedules/{scheduleId} */
/** PUT /api/medications/schedules/{scheduleId} */
export async function updateMedicationSchedule(
  scheduleId: number,
  input: UpdateMedicationScheduleInput,
): Promise<MedicationSchedule> {
  const isWeekly = input.scheduleType === "WEEKLY";
  const dayOfWeek =
    isWeekly && input.daysOfWeek.length > 0 ? input.daysOfWeek[0] : null;
  const daysOfWeek = isWeekly ? input.daysOfWeek : [];

  const res = await api.put<MedicationScheduleResponseRaw>(
    `/api/medications/schedules/${scheduleId}`,
    {
      medicationName: input.medicationName,
      scheduledTime: toBackendTime(input.scheduledTime),
      allowedEarlyMinutes: DEFAULT_ALLOWED_EARLY_MINUTES,
      allowedDelayMinutes: DEFAULT_ALLOWED_DELAY_MINUTES,
      scheduleType: input.scheduleType,
      dayOfWeek,
      daysOfWeek,
      active: input.active,
      startDate: input.startDate ?? null, // ← 추가
      endDate: input.endDate ?? null, // ← 추가
    },
  );
  return toFrontSchedule(res.data);
}
/** DELETE /api/medications/schedules/{scheduleId} — soft delete */
export async function deleteMedicationSchedule(
  scheduleId: number,
): Promise<void> {
  await api.delete(`/api/medications/schedules/${scheduleId}`);
}

/**
 * PUT /api/wards/{wardId}/medication-schedules/groups/{groupId}/packets/time (4-3)
 * 봉지 시각 이동 — (groupId, fromTime)의 모든 성분(요일별 row 포함)을 한 번에 toTime으로.
 * 한 줄만 옮겨 옛 시간이 잔존하는 버그를 구조적으로 차단.
 */
export async function moveMedicationPacketTime(
  protegeId: number,
  groupId: string,
  fromTime: string,
  toTime: string,
): Promise<void> {
  await api.put(
    `/api/wards/${protegeId}/medication-schedules/groups/${encodeURIComponent(
      groupId,
    )}/packets/time`,
    { fromTime: toBackendTime(fromTime), toTime: toBackendTime(toTime) },
  );
}

/**
 * POST /api/wards/{wardId}/medication-schedules/groups/{groupId}/packets (봉지에 시각 추가)
 * MANUAL 봉지만. 약명은 서버가 봉지의 기존 약명을 상속한다.
 */
export async function addMedicationPacket(
  protegeId: number,
  groupId: string,
  input: {
    scheduledTime: string;
    scheduleType: MedicationScheduleType;
    daysOfWeek: DayOfWeek[];
    startDate?: string | null;
    endDate?: string | null;
  },
): Promise<void> {
  await api.post(
    `/api/wards/${protegeId}/medication-schedules/groups/${encodeURIComponent(
      groupId,
    )}/packets`,
    {
      scheduledTime: toBackendTime(input.scheduledTime),
      scheduleType: input.scheduleType,
      daysOfWeek: input.scheduleType === "WEEKLY" ? input.daysOfWeek : [],
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
    },
  );
}

/**
 * PUT /api/wards/{wardId}/medication-schedules/groups/{groupId}/packets/{scheduledTime} (4-4)
 * 봉지 속성(유형/요일/기간) 변경.
 */
export async function updateMedicationPacket(
  protegeId: number,
  groupId: string,
  scheduledTime: string,
  input: {
    scheduleType: MedicationScheduleType;
    daysOfWeek: DayOfWeek[];
    startDate?: string | null;
    endDate?: string | null;
  },
): Promise<void> {
  await api.put(
    `/api/wards/${protegeId}/medication-schedules/groups/${encodeURIComponent(
      groupId,
    )}/packets/${encodeURIComponent(toBackendTime(scheduledTime))}`,
    {
      scheduleType: input.scheduleType,
      daysOfWeek: input.scheduleType === "WEEKLY" ? input.daysOfWeek : [],
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
    },
  );
}

/**
 * DELETE /api/wards/{wardId}/medication-schedules/groups/{groupId} (4-6)
 * 봉지(약/처방) 통째 삭제.
 */
export async function deleteMedicationGroup(
  protegeId: number,
  groupId: string,
): Promise<void> {
  await api.delete(
    `/api/wards/${protegeId}/medication-schedules/groups/${encodeURIComponent(
      groupId,
    )}`,
  );
}

/**
 * DELETE /api/wards/{wardId}/medication-schedules/groups/{groupId}/packets/{scheduledTime} (4-6)
 * 특정 봉지(시각)만 삭제.
 */
export async function deleteMedicationPacket(
  protegeId: number,
  groupId: string,
  scheduledTime: string,
): Promise<void> {
  await api.delete(
    `/api/wards/${protegeId}/medication-schedules/groups/${encodeURIComponent(
      groupId,
    )}/packets/${encodeURIComponent(toBackendTime(scheduledTime))}`,
  );
}

/**
 * POST /api/wards/{wardId}/medication-schedules/groups (4-5, 수동 봉지 생성)
 * 약 1개 = 봉지 1개. packets의 시각마다 일정 생성.
 */
export async function createMedicationGroup(
  protegeId: number,
  input: {
    medicationName: string;
    packets: {
      scheduledTime: string;
      scheduleType: MedicationScheduleType;
      daysOfWeek: DayOfWeek[];
      startDate?: string | null;
      endDate?: string | null;
    }[];
  },
): Promise<void> {
  await api.post(`/api/wards/${protegeId}/medication-schedules/groups`, {
    medicationName: input.medicationName,
    packets: input.packets.map((p) => ({
      scheduledTime: toBackendTime(p.scheduledTime),
      scheduleType: p.scheduleType,
      daysOfWeek: p.scheduleType === "WEEKLY" ? p.daysOfWeek : [],
      startDate: p.startDate ?? null,
      endDate: p.endDate ?? null,
    })),
  });
}

/**
 * PATCH /api/wards/{wardId}/medication-schedules/groups/{groupId} (봉지 이름 변경)
 * MANUAL 봉지만.
 */
export async function renameMedicationGroup(
  protegeId: number,
  groupId: string,
  medicationName: string,
): Promise<void> {
  await api.patch(
    `/api/wards/${protegeId}/medication-schedules/groups/${encodeURIComponent(
      groupId,
    )}`,
    { medicationName },
  );
}

// ────────────────────────────────────────────
// API: 복약 기록
// ────────────────────────────────────────────

/** POST /api/medications/logs — 약 복용 체크 */
export async function takeMedication(
  input: TakeMedicationInput,
): Promise<MedicationLog> {
  const res = await api.post<MedicationLogResponseRaw>(
    "/api/medications/logs",
    {
      wardId: input.protegeId,
      scheduleId: input.scheduleId,
      takenAt: input.takenAt,
      medicationName: input.medicationName,
      logSource: input.logSource,
    },
  );
  return toFrontLog(res.data);
}

/** GET /api/wards/{wardId}/medication-logs/source?date={YYYY-MM-DD} */
export async function getMedicationLogsByDate(
  protegeId: number,
  date?: string,
): Promise<MedicationLog[]> {
  const res = await api.get<MedicationLogResponseRaw[]>(
    `/api/wards/${protegeId}/medication-logs/source`,
    { params: date ? { date } : undefined },
  );
  return res.data.map(toFrontLog);
}
