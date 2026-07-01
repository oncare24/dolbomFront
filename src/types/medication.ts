// src/types/medication.ts

// 복약 도메인 타입.
//
// 백엔드 ↔ 프론트 변환 규칙:
//  - wardId (백) ↔ protegeId (프)
//  - "HH:mm:ss" (백 LocalTime) ↔ "HH:mm" (프)
//  - DAILY인 경우 daysOfWeek는 빈 배열로 통일
//
// 허용 오차(allowedEarlyMinutes / allowedDelayMinutes)는 백엔드 기본값(30/60)을
// 그대로 사용하므로 프론트 타입에는 노출하지 않음.

export type MedicationScheduleType = "DAILY" | "WEEKLY";

export type MedicationLogSource = "USER_INPUT" | "GUARDIAN_INPUT" | "SYSTEM";

/** 봉지(DoseGroup) 출처. AUTO=CODEF 자동등록, MANUAL=수동. */
export type MedicationSource = "AUTO" | "MANUAL";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

/** 복약 일정 (프론트). */
export interface MedicationSchedule {
  id: number;

  scheduleIds: number[];
  protegeId: number;
  medicationName: string;
  /** "HH:mm" — 예: "08:00" */
  scheduledTime: string;
  scheduleType: MedicationScheduleType;
  /** DAILY인 경우 빈 배열. WEEKLY는 1개 이상. */
  daysOfWeek: DayOfWeek[];
  active: boolean;
  createdAt: string;
  startDate?: string | null; // "YYYY-MM-DD" — 기간 약만, 없으면 null
  endDate?: string | null; // "YYYY-MM-DD" — 기간 약만, 없으면 null
  /** 봉지(DoseGroup) 식별자. 봉지 API로 조회한 경우 존재. */
  groupId?: string;
  /** 봉지 출처(AUTO/MANUAL). 봉지 API로 조회한 경우 존재. */
  source?: MedicationSource;
}

/** 오늘의 약 — 성분(scheduleId)별 복용 상태 (4-2 today). */
export interface TodayMedicationItem {
  scheduleId: number;
  name: string;
  taken: boolean;
  /** ISO datetime. 미복용이면 null. */
  takenAt: string | null;
}

/** 오늘의 약 — 시각(슬롯) 단위 (4-2 today). */
export interface TodayMedicationSlot {
  /** "HH:mm" */
  scheduledTime: string;
  label: string | null;
  allTaken: boolean;
  items: TodayMedicationItem[];
}

/** 복약 기록 (프론트). */
export interface MedicationLog {
  id: number;
  protegeId: number;
  /** 일정 없이 직접 기록한 경우 null */
  scheduleId: number | null;
  medicationName: string;
  /** ISO datetime — 예: "2026-05-17T08:05:00" */
  takenAt: string;
  logSource: MedicationLogSource;
}

// ────────────────────────────────────────────
// 입력 DTO
// ────────────────────────────────────────────

export interface CreateMedicationScheduleInput {
  protegeId: number;
  medicationName: string;
  /** "HH:mm" */
  scheduledTime: string;
  scheduleType: MedicationScheduleType;
  daysOfWeek: DayOfWeek[];
  startDate?: string | null; // "YYYY-MM-DD" — 계속 복용이면 null
  endDate?: string | null;
}

export interface UpdateMedicationScheduleInput {
  medicationName: string;
  scheduledTime: string;
  scheduleType: MedicationScheduleType;
  daysOfWeek: DayOfWeek[];
  active: boolean;
  startDate?: string | null; // 추가
  endDate?: string | null; // 추가s
}

export interface TakeMedicationInput {
  protegeId: number;
  /** 일정 없이 직접 기록한 경우 null */
  scheduleId: number | null;
  /** ISO datetime. 보통 현재 시각. */
  takenAt: string;
  /** scheduleId 없을 때 필수 */
  medicationName?: string;
  /** USER_INPUT (피보호자) 또는 GUARDIAN_INPUT (보호자) */
  logSource: MedicationLogSource;
}
