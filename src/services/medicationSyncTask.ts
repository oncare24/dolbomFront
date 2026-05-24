// 보호자가 원격으로 약 일정을 바꿨을 때, 어머니 앱이 백그라운드/종료 상태여도
// silent push(MEDICATION_SCHEDULE_CHANGED)를 받아 로컬 알람을 재동기화하는 백그라운드 태스크.
//
// 한 번 import되면 TaskManager에 글로벌 등록되므로 index.ts 최상단에서 side-effect import 필수.
// (종료 상태에서 헤드리스로 실행되려면 App이 아니라 entry(index.ts) 모듈 그래프에 있어야 함)
//
// 한계: 사용자가 앱을 "강제 종료"하면 OS가 푸시 자체를 막아 이 태스크도 안 깨어남.
//       그 경우는 포그라운드 복귀(App.tsx의 AppState fallback) 때 복구됨.

import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";

import { useAuthStore } from "../stores/authStore";
import {
  getMedicationLogsByDate,
  getMedicationSchedules,
} from "./medicationService";
import { syncAllMedicationReminders } from "./medicationReminderService";
import { nowLocalDateTimeIso } from "../utils/medicationSummary";

export const MEDICATION_SYNC_TASK = "boslapim-medication-schedule-sync-task";

/** 태스크 데이터에서 push type 추출. expo/SDK 버전별로 위치가 달라 방어적으로 탐색. */
function extractPushType(taskData: unknown): string | undefined {
  const d = taskData as any;
  return (
    d?.type ??
    d?.data?.type ??
    d?.notification?.data?.type ??
    d?.notification?.request?.content?.data?.type
  );
}

/** 서버 일정 기준으로 어머니 폰 로컬 알람 재동기화. (포그라운드 hook과 동일 로직) */
async function resyncFromServer(): Promise<void> {
  // 헤드리스 콜드스타트는 persist가 아직 hydrate 안 됨 → SecureStore에서 복원.
  try {
    await useAuthStore.persist?.rehydrate?.();
  } catch (e) {
    console.warn("[MED-SYNC-BG] auth rehydrate failed:", e);
  }

  const { user } = useAuthStore.getState();
  if (user?.role !== "elderly" || !user.id) return; // 어머니 폰만 알람을 건다

  const schedules = await getMedicationSchedules(user.id);

  // 오늘 이미 복용한 회차는 skipToday → 재동기화로 다시 울리지 않게.
  let checkedIds = new Set<number>();
  try {
    const today = nowLocalDateTimeIso().slice(0, 10);
    const logs = await getMedicationLogsByDate(user.id, today);
    checkedIds = new Set(
      logs.map((l) => l.scheduleId).filter((id): id is number => id !== null),
    );
  } catch (e) {
    console.warn("[MED-SYNC-BG] today logs fetch 실패, skip 처리 생략:", e);
  }

  await syncAllMedicationReminders(schedules, checkedIds);
  console.log("[MED-SYNC-BG] background resync complete");
}

TaskManager.defineTask(MEDICATION_SYNC_TASK, async ({ data, error }) => {
  if (error) {
    console.warn("[MED-SYNC-BG] task error:", error);
    return;
  }
  // ⚠️ 실기기에서 이 로그로 실제 payload 모양을 한 번 확인할 것 (SDK 55 기준).
  console.log("[MED-SYNC-BG] task fired. raw:", JSON.stringify(data));

  if (extractPushType(data) !== "MEDICATION_SCHEDULE_CHANGED") return;

  try {
    await resyncFromServer();
  } catch (e) {
    console.warn("[MED-SYNC-BG] resync failed:", e);
  }
});

/** 포그라운드(앱 실행) 컨텍스트에서 한 번 호출해 태스크를 등록. */
export async function registerMedicationSyncTask(): Promise<void> {
  try {
    await Notifications.registerTaskAsync(MEDICATION_SYNC_TASK);
    console.log("[MED-SYNC-BG] task registered");
  } catch (e) {
    console.warn("[MED-SYNC-BG] task register failed:", e);
  }
}
