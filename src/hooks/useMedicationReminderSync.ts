// 어머니 로그인 시 서버 약 일정과 로컬 알림 동기화.
//
// App.tsx에서 마운트. role=elderly + 인증된 경우에만 활성.
// schedules 캐시가 갱신될 때마다 자동 동기화 → 보호자가 어머니 약 추가/수정해도
// 어머니 앱이 schedules invalidate되는 시점에 알림 재등록.

import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useMedicationSchedules } from "./useMedications";
import { syncAllMedicationReminders } from "../services/medicationReminderService";

export function useMedicationReminderSync() {
  const role = useAuthStore((s) => s.user?.role);
  const userId = useAuthStore((s) => s.user?.id);
  const enabled = role === "elderly" && !!userId;

  const { data: schedules } = useMedicationSchedules(userId ?? 0, {
    enabled,
  });

  useEffect(() => {
    if (!enabled || !schedules) return;
    syncAllMedicationReminders(schedules).catch((e) =>
      console.warn("[MED-LOCAL] sync failed:", e),
    );
  }, [enabled, schedules]);
}
