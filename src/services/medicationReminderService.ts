// 어머니 폰 로컬 약 알람 서비스 (notify-kit 기반).
//
// 책임:
//   1) 약 일정 1개 등록 → DAILY 1개 또는 WEEKLY N개 알람을 OS AlarmManager에 예약
//   2) scheduleId → notificationId[] 매핑을 AsyncStorage에 영속화
//   3) 약 수정/삭제 → 매핑 보고 기존 알람 cancel + 재등록
//   4) 앱 시작 시 → 전체 cancel + 서버 일정으로 재등록
//
// 핵심:
//   - role=elderly 인 사용자만 등록
//   - fullScreenAction으로 잠금화면 위 풀스크린 알람 진입
//   - SET_EXACT_AND_ALLOW_WHILE_IDLE 디폴트 → Doze 모드 우회 + ±1초 이내 정시 발화
//   - sound 없음 — 풀스크린 진입 후 TTS가 음성 안내 담당
//   - 알람 카테고리 + bypassDnd → DND 모드 통과
//   - 등록 전 pre-cancel + 좀비 sweep 이중 누수 차단

import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidCategory,
  AndroidImportance,
  AndroidLaunchActivityFlag,
  AlarmType,
  TimestampTrigger,
} from "react-native-notify-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../stores/authStore";
import type { DayOfWeek, MedicationSchedule } from "../types/medication";

const STORAGE_KEY = "medication-reminder-map-v2";
const CHANNEL_ID = "medication_alarm_v2";

// JS Date.getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
const WEEKDAY_INDEX: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

type ReminderMap = Record<number, string[]>;

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

/** DAILY: 오늘 시각이 이미 지났으면 내일, 아니면 오늘. */
function nextDailyTimestamp(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime();
}

/** WEEKLY: 다음 해당 요일의 시각. 오늘이면서 이미 지났으면 +7일. */
function nextWeeklyTimestamp(
  hour: number,
  minute: number,
  weekday: number, // 0=Sunday..6=Saturday
): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  const currentDay = target.getDay();
  let diff = weekday - currentDay;
  if (diff < 0 || (diff === 0 && target.getTime() <= now.getTime())) {
    diff += 7;
  }
  target.setDate(target.getDate() + diff);
  return target.getTime();
}

/** 공통 trigger 옵션. */
function buildAlarmTrigger(
  timestamp: number,
  repeatFrequency: RepeatFrequency,
): TimestampTrigger {
  return {
    type: TriggerType.TIMESTAMP,
    timestamp,
    repeatFrequency,
    alarmManager: {
      type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
    },
  };
}

/**
 * 약 일정 1개의 로컬 알람 등록.
 * 보호자 role이면 no-op. 어머니 폰에서만 동작.
 * 기존 매핑이 있으면 먼저 cancel — 매핑 overwrite로 인한 좀비 차단.
 */
export async function scheduleLocalRemindersForMedication(
  schedule: MedicationSchedule,
): Promise<void> {
  if (!isElderly()) return;
  if (!schedule.active) return;

  // 같은 schedule.id 알람이 이미 있으면 먼저 정리.
  await cancelLocalRemindersForMedication(schedule.id);

  const [hourStr, minuteStr] = schedule.scheduledTime.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const buildNotification = (timestamp: number) => ({
    title: "약 드실 시간이에요",
    body: `${schedule.medicationName} 먹을 시간입니다`,
    data: {
      type: "MEDICATION_REMINDER",
      scheduleId: String(schedule.id),
      medicationName: schedule.medicationName,
    },
    android: {
      channelId: CHANNEL_ID,
      category: AndroidCategory.ALARM,
      importance: AndroidImportance.HIGH,
      smallIcon: "ic_notification",
      color: "#FF8A3D",
      autoCancel: false,
      ongoing: true,
      pressAction: {
        id: "default",
        launchActivity: "default",
        launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
      },
      fullScreenAction: {
        id: "medication_alarm",
        launchActivity: "default",
      },
    },
  });

  const map = await loadMap();
  const notificationIds: string[] = [];

  if (schedule.scheduleType === "DAILY") {
    const timestamp = nextDailyTimestamp(hour, minute);
    const trigger = buildAlarmTrigger(timestamp, RepeatFrequency.DAILY);
    const id = await notifee.createTriggerNotification(
      buildNotification(timestamp),
      trigger,
    );
    notificationIds.push(id);
  } else {
    for (const dow of schedule.daysOfWeek) {
      const weekday = WEEKDAY_INDEX[dow];
      const timestamp = nextWeeklyTimestamp(hour, minute, weekday);
      const trigger = buildAlarmTrigger(timestamp, RepeatFrequency.WEEKLY);
      const id = await notifee.createTriggerNotification(
        buildNotification(timestamp),
        trigger,
      );
      notificationIds.push(id);
    }
  }

  map[schedule.id] = notificationIds;
  await saveMap(map);

  console.log(
    `[MED-LOCAL] scheduled ${notificationIds.length} alarm(s) for scheduleId=${schedule.id} (${schedule.medicationName} ${schedule.scheduledTime})`,
  );
}

/** 약 일정 1개의 로컬 알람 전부 취소. */
export async function cancelLocalRemindersForMedication(
  scheduleId: number,
): Promise<void> {
  const map = await loadMap();
  const ids = map[scheduleId];
  if (!ids || ids.length === 0) return;

  for (const id of ids) {
    try {
      await notifee.cancelTriggerNotification(id);
    } catch (e) {
      console.warn(`[MED-LOCAL] failed to cancel ${id}:`, e);
    }
  }

  delete map[scheduleId];
  await saveMap(map);

  console.log(
    `[MED-LOCAL] cancelled ${ids.length} alarm(s) for scheduleId=${scheduleId}`,
  );
}

/** 전체 동기화. 모든 로컬 알람 취소 → 서버 일정으로 재등록. */
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
 * 모든 로컬 약 알람 취소 + 매핑 클리어.
 * 매핑 기준 cancel(빠른 경로) + 매핑 외 좀비 sweep(안전망) 이중 동작.
 */
export async function clearAllMedicationReminders(): Promise<void> {
  // 1) 매핑 기준 cancel — 정상 흐름의 빠른 정리.
  const map = await loadMap();
  for (const ids of Object.values(map)) {
    for (const id of ids) {
      try {
        await notifee.cancelTriggerNotification(id);
      } catch (e) {
        console.warn(`[MED-LOCAL] failed to cancel ${id}:`, e);
      }
    }
  }

  // 2) 매핑에 없는 좀비 sweep — 복약 trigger만 골라서 cancel.
  //    앱 재설치 / AsyncStorage clear / 매핑 overwrite 누수 안전망.
  //    data.type으로 필터링해서 다른 종류 trigger는 건드리지 않음.
  try {
    const triggers = await notifee.getTriggerNotifications();
    const zombieIds = triggers
      .filter((t) => t.notification.data?.type === "MEDICATION_REMINDER")
      .map((t) => t.notification.id)
      .filter((id): id is string => !!id);

    for (const id of zombieIds) {
      try {
        await notifee.cancelTriggerNotification(id);
      } catch (e) {
        console.warn(`[MED-LOCAL] failed to cancel zombie ${id}:`, e);
      }
    }

    if (zombieIds.length > 0) {
      console.log(`[MED-LOCAL] swept ${zombieIds.length} zombie reminder(s)`);
    }
  } catch (e) {
    console.warn("[MED-LOCAL] zombie sweep failed:", e);
  }

  await saveMap({});
  console.log("[MED-LOCAL] all reminders cleared (map + OS)");
}
