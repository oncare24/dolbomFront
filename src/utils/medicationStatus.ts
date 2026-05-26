// 약 일정 1개의 "오늘" 복약 상태 판정.
//
// 사용처:
//   - MedicationListScreen 카드 뱃지
//   - 향후 다른 화면에서 같은 로직 재사용 가능
//
// 마감 시각 = 예정 시각 + 허용 지각 분(60분, 백엔드 기본값).
// 프론트 타입에 allowedDelayMinutes 없어서 상수로 박음.

import type {
  DayOfWeek,
  MedicationLog,
  MedicationSchedule,
} from "../types/medication";

export type MedicationTodayStatus =
  | { kind: "TAKEN"; takenAt: string }
  | { kind: "UPCOMING" }
  | { kind: "MISSED" }
  | { kind: "NOT_TODAY" };

// JavaScript Date.getDay(): Sunday=0, Monday=1, ..., Saturday=6
const DAY_INDEX_TO_DOW: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const DEFAULT_ALLOWED_DELAY_MINUTES = 60;

export function getMedicationTodayStatus(
  schedule: MedicationSchedule,
  todayLogs: MedicationLog[],
  now: Date = new Date(),
): MedicationTodayStatus {
  // 1. WEEKLY인데 오늘 요일 아니면 NOT_TODAY
  if (schedule.scheduleType === "WEEKLY") {
    const todayDow = DAY_INDEX_TO_DOW[now.getDay()];
    if (!schedule.daysOfWeek.includes(todayDow)) {
      return { kind: "NOT_TODAY" };
    }
  }
  // 2. 오늘 이 스케줄로 찍힌 로그가 있으면 TAKEN
  const log = todayLogs.find((l) => l.scheduleId === schedule.id);
  if (log) {
    return { kind: "TAKEN", takenAt: log.takenAt };
  }

  // 2.5 등록 시각(createdAt) 이전 회차는 오늘 대상 아님.
  //     9시에 등록한 8시 약은 먹을 기회가 없었으므로 미복용으로 세지 않음.
  //     (위에서 TAKEN이면 이미 반환됨 — 먹은 건 항상 인정)
  const [ch, cm] = schedule.scheduledTime.split(":").map(Number);
  const doseToday = new Date(now);
  doseToday.setHours(ch, cm, 0, 0);
  if (
    schedule.createdAt &&
    doseToday.getTime() < new Date(schedule.createdAt).getTime()
  ) {
    return { kind: "NOT_TODAY" };
  }

  // 3. 마감 시각 안 지났으면 UPCOMING
  const [hh, mm] = schedule.scheduledTime.split(":").map(Number);
  const deadline = new Date(now);
  deadline.setHours(hh, mm + DEFAULT_ALLOWED_DELAY_MINUTES, 0, 0);
  if (now < deadline) {
    return { kind: "UPCOMING" };
  }

  // 4. 마감 시각 지났고 로그 없으면 MISSED
  return { kind: "MISSED" };
}

/** ISO "2026-05-19T09:05:00" → "09:05" */
export function takenAtToTimeLabel(takenAt: string): string {
  return takenAt.slice(11, 16);
}
