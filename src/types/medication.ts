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
  protegeId: number;
  medicationName: string;
  /** "HH:mm" — 예: "08:00" */
  scheduledTime: string;
  scheduleType: MedicationScheduleType;
  /** DAILY인 경우 빈 배열. WEEKLY는 1개 이상. */
  daysOfWeek: DayOfWeek[];
  active: boolean;
  createdAt: string;
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
}

export interface UpdateMedicationScheduleInput {
  medicationName: string;
  scheduledTime: string;
  scheduleType: MedicationScheduleType;
  daysOfWeek: DayOfWeek[];
  active: boolean;
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
