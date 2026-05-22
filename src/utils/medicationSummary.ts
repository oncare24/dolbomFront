// src/utils/medicationSummary.ts

// 복약 일정 + 오늘 로그를 미리보기용 요약으로 변환.
// ProtegeDetailScreen / ElderlyHomeScreen 카드에서 재사용.

import type {
  DayOfWeek,
  MedicationLog,
  MedicationSchedule,
} from "../types/medication";

const DOW_MAP: Record<number, DayOfWeek> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export interface MedicationDailySummary {
  /** 오늘 복용해야 할 총 횟수 */
  totalCount: number;
  /** 이미 복용한 횟수 */
  takenCount: number;
  /** 다음 복용 시각 ("HH:mm"). 모두 완료 또는 일정 없음이면 null */
  nextTime: string | null;
  /** 다음 복용 약 이름. 모두 완료 또는 일정 없음이면 null */
  nextMedicationName: string | null;
  /** 일정이 있고 모두 복용 완료된 경우 true */
  allDone: boolean;
}

/**
 * 오늘 일정 = active && (DAILY || 오늘 요일이 daysOfWeek에 포함).
 * 다음 복용 = 미복용 일정 중 현재 시각 이후 가장 가까운 것 (없으면 가장 이른 미복용).
 */
export function buildMedicationDailySummary(
  schedules: MedicationSchedule[],
  todayLogs: MedicationLog[],
  now: Date = new Date(),
): MedicationDailySummary {
  const todayDow = DOW_MAP[now.getDay()];

  const todaySchedules = schedules.filter(
    (s) =>
      s.active &&
      (s.scheduleType === "DAILY" || s.daysOfWeek.includes(todayDow)),
  );

  const takenScheduleIds = new Set(
    todayLogs
      .map((l) => l.scheduleId)
      .filter((id): id is number => id !== null),
  );

  const remaining = todaySchedules
    .filter((s) => !takenScheduleIds.has(s.id))
    .map((s) => {
      const [h, m] = s.scheduledTime.split(":").map(Number);
      return { schedule: s, minutes: h * 60 + m };
    })
    .sort((a, b) => a.minutes - b.minutes);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming =
    remaining.find((x) => x.minutes >= nowMinutes) ?? remaining[0];

  const takenCount = todaySchedules.length - remaining.length;
  const allDone = todaySchedules.length > 0 && remaining.length === 0;

  return {
    totalCount: todaySchedules.length,
    takenCount,
    nextTime: upcoming?.schedule.scheduledTime ?? null,
    nextMedicationName: upcoming?.schedule.medicationName ?? null,
    allDone,
  };
}

/** "YYYY-MM-DD" 로컬 날짜 문자열 (백엔드 date 파라미터용). */
export function todayDateString(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 로컬 시간대 기준 LocalDateTime 문자열 ("YYYY-MM-DDTHH:mm:ss", Z 없음).
 *
 * 백엔드 takenAt 필드(LocalDateTime)와 1:1 매칭.
 * `new Date().toISOString()`은 UTC `Z` 문자열이라
 * Jackson 동작/타임존 설정에 따라 9시간 어긋날 수 있음 → 로컬 ISO 사용.
 */
export function nowLocalDateTimeIso(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getFullYear();
  const M = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  return `${y}-${M}-${d}T${h}:${m}:${s}`;
}
