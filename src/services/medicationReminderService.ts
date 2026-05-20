// 어머니 폰 로컬 약 알림 서비스.
//
// 책임:
//   1) 약 일정 1개 등록 → DAILY 1개 또는 WEEKLY N개 로컬 알림을 OS 큐에 예약
//   2) scheduleId → notificationId[] 매핑을 AsyncStorage에 영속화
//   3) 약 수정/삭제 → 매핑 보고 기존 알림 cancel + 재등록
//   4) 앱 시작 시 → 전체 cancel + 서버 일정으로 재등록 (기기 교체/재설치 대응의 핵심)
//
// 핵심:
//   - role=elderly 인 사용자만 등록. 보호자 폰에 어머니 약 알림이 울리면 안 됨.
//   - scheduleNotificationAsync는 OS 큐에 들어가서 앱이 꺼져 있어도 정시에 울림.

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../stores/authStore";
import type { DayOfWeek, MedicationSchedule } from "../types/medication";

const STORAGE_KEY = "medication-reminder-map-v1";
const ANDROID_CHANNEL_ID = "medication";

// expo-notifications weekday: 1=Sunday, 2=Monday, ..., 7=Saturday
const WEEKDAY_MAP: Record<DayOfWeek, number> = {
  SUNDAY: 1,
  MONDAY: 2,
  TUESDAY: 3,
  WEDNESDAY: 4,
  THURSDAY: 5,
  FRIDAY: 6,
  SATURDAY: 7,
};

// ─── 매핑 저장소 ──────────────────────────────────────────
type ReminderMap = Record<number, string[]>; // scheduleId → notificationIds

async function loadMap(): Promise<ReminderMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveMap(map: ReminderMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function isElderly(): boolean {
  return useAuthStore.getState().user?.role === "elderly";
}
// ─── 등록 / 취소 / 동기화 ────────────────────────────────

/**
 * 약 일정 1개의 로컬 알림 등록.
 * 보호자 role이면 no-op. 어머니 폰에서만 동작.
 */
export async function scheduleLocalRemindersForMedication(
  schedule: MedicationSchedule,
): Promise<void> {
  if (!isElderly()) return;
  if (!schedule.active) return;

  const [hourStr, minuteStr] = schedule.scheduledTime.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const content: Notifications.NotificationContentInput = {
    title: "약 드실 시간이에요",
    body: `${schedule.medicationName} 드실 시간입니다`,
    data: {
      type: "MEDICATION_REMINDER",
      scheduleId: schedule.id,
    },
  };

  const map = await loadMap();
  const notificationIds: string[] = [];

  if (schedule.scheduleType === "DAILY") {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
    notificationIds.push(id);
  } else {
    // WEEKLY — 요일별 1개씩
    for (const dow of schedule.daysOfWeek) {
      const weekday = WEEKDAY_MAP[dow];
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
          channelId: ANDROID_CHANNEL_ID,
        },
      });
      notificationIds.push(id);
    }
  }

  map[schedule.id] = notificationIds;
  await saveMap(map);

  console.log(
    `[MED-LOCAL] scheduled ${notificationIds.length} reminder(s) for scheduleId=${schedule.id} (${schedule.medicationName} ${schedule.scheduledTime})`,
  );
}

/**
 * 약 일정 1개의 로컬 알림 전부 취소.
 * 매핑에 없으면 no-op.
 */
export async function cancelLocalRemindersForMedication(
  scheduleId: number,
): Promise<void> {
  const map = await loadMap();
  const ids = map[scheduleId];
  if (!ids || ids.length === 0) return;

  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.warn(`[MED-LOCAL] failed to cancel ${id}:`, e);
    }
  }

  delete map[scheduleId];
  await saveMap(map);

  console.log(
    `[MED-LOCAL] cancelled ${ids.length} reminder(s) for scheduleId=${scheduleId}`,
  );
}

/**
 * 전체 동기화. 모든 로컬 알림 취소 → 서버 일정으로 재등록.
 * 앱 시작 시 / 로그인 직후 호출. 기기 교체·앱 재설치 대응의 핵심.
 */
export async function syncAllMedicationReminders(
  schedules: MedicationSchedule[],
): Promise<void> {
  if (!isElderly()) return;

  await clearAllMedicationReminders();

  const activeSchedules = schedules.filter((s) => s.active);
  for (const schedule of activeSchedules) {
    await scheduleLocalRemindersForMedication(schedule);
  }

  console.log(
    `[MED-LOCAL] sync complete — ${activeSchedules.length} schedule(s) registered`,
  );
}

/**
 * 모든 로컬 약 알림 취소 + 매핑 클리어.
 * 로그아웃 시 호출.
 */
export async function clearAllMedicationReminders(): Promise<void> {
  const map = await loadMap();
  for (const ids of Object.values(map)) {
    for (const id of ids) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (e) {
        console.warn(`[MED-LOCAL] failed to cancel ${id}:`, e);
      }
    }
  }
  await saveMap({});
  console.log("[MED-LOCAL] all reminders cleared");
}
