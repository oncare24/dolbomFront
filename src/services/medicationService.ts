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
  TakeMedicationInput,
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

// source API 응답 — encrypted_activity_log 복호화 결과.
// 일반 GET 응답과 달리 wardId가 path param에 있어 본문에는 없음.
interface MedicationScheduleSourceResponseRaw {
  scheduleId: number;
  medicationName: string;
  scheduledTime: string;
  allowedEarlyMinutes: number;
  allowedDelayMinutes: number;
  scheduleType: MedicationScheduleType;
  dayOfWeek: DayOfWeek | null;
  daysOfWeek: DayOfWeek[];
  active: boolean;
  lastChangedAt: string;
}

function toFrontSchedule(
  raw: MedicationScheduleResponseRaw,
): MedicationSchedule {
  return {
    id: raw.scheduleId,
    protegeId: raw.wardId,
    medicationName: raw.medicationName,
    scheduledTime: toFrontTime(raw.scheduledTime),
    scheduleType: raw.scheduleType,
    daysOfWeek: raw.scheduleType === "DAILY" ? [] : raw.daysOfWeek ?? [],
    active: raw.active,
    createdAt: raw.createdAt,
  };
}

function toFrontScheduleFromSource(
  raw: MedicationScheduleSourceResponseRaw,
  protegeId: number,
): MedicationSchedule {
  return {
    id: raw.scheduleId,
    protegeId,
    medicationName: raw.medicationName,
    scheduledTime: toFrontTime(raw.scheduledTime),
    scheduleType: raw.scheduleType,
    daysOfWeek: raw.scheduleType === "DAILY" ? [] : raw.daysOfWeek ?? [],
    active: raw.active,
    createdAt: raw.lastChangedAt,
  };
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
  const res = await api.get<MedicationScheduleSourceResponseRaw[]>(
    `/api/wards/${protegeId}/medication-schedules/source`,
  );
  const flat = res.data.map((raw) => toFrontScheduleFromSource(raw, protegeId));
  return groupSchedules(flat);
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
