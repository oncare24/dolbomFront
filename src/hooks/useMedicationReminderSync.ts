// 어머니 로그인 시 서버 약 일정 + 오늘 복용 로그를 로컬 알림과 동기화.
// 오늘 이미 복용한 schedule은 skipToday=true로 등록 → 그 회차 알람 안 울림.

import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import {
  useMedicationLogsByDate,
  useMedicationSchedules,
} from "./useMedications";
import { syncAllMedicationReminders } from "../services/medicationReminderService";
import { nowLocalDateTimeIso } from "../utils/medicationSummary";

export function useMedicationReminderSync() {
  const role = useAuthStore((s) => s.user?.role);
  const userId = useAuthStore((s) => s.user?.id);
  const enabled = role === "elderly" && !!userId;

  const { data: schedules } = useMedicationSchedules(userId ?? 0, {
    enabled,
  });

  const today = nowLocalDateTimeIso().slice(0, 10);
  const { data: todayLogs } = useMedicationLogsByDate(userId ?? 0, today, {
    enabled,
  });

  useEffect(() => {
    if (!enabled || !schedules) return;
    // MedicationLog.scheduleId는 number | null (일정 없이 직접 기록한 로그 대비).
    // null인 로그는 skipToday 판단 대상이 아니므로 필터.
    const checkedIds = new Set<number>(
      (todayLogs ?? [])
        .map((l) => l.scheduleId)
        .filter((id): id is number => id !== null),
    );
    syncAllMedicationReminders(schedules, checkedIds).catch((e) =>
      console.warn("[MED-LOCAL] sync failed:", e),
    );
  }, [enabled, schedules, todayLogs]);
}
