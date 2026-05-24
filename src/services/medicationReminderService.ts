// 어머니 폰 로컬 약 알람 서비스 (notify-kit 기반).
//
// 책임:
//   1) 약 일정 1개 등록 → DAILY 1개 또는 WEEKLY N개 알람을 OS AlarmManager에 예약
//   2) scheduleId → notificationId[] 매핑을 AsyncStorage에 영속화
//   3) 약 수정/삭제 → 매핑 + OS 진실원천 둘 다 보고 cancel + 재등록
//   4) 앱 시작 시 → 서버 schedules + 오늘 복용 로그로 재등록 (이미 복용한 schedule은 skipToday)
//
// 핵심:
//   - role=elderly 인 사용자만 등록
//   - fullScreenAction으로 잠금화면 위 풀스크린 알람 진입
//   - SET_EXACT_AND_ALLOW_WHILE_IDLE 디폴트 → Doze 모드 우회
//   - cancel은 매핑이 아닌 OS getTriggerNotifications 기준 sweep → 좀비 차단
//   - sync는 mutex로 직렬화 + 마지막 schedules만 유효 → race condition 차단
//   - 오늘 이미 복용한 schedule은 skipToday로 재등록 → 그 회차 알람 안 울림

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

/** "YYYY-MM-DD" → 로컬 자정 Date (UTC 파싱 시 날짜 밀림 방지). */
function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split("-").map((v) => parseInt(v, 10));
  return new Date(y, m - 1, d);
}

function sameYmd(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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
  weekday: number,
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

/** DAILY: 오늘 회차 무조건 skip. 내일부터 시작. */
function nextDailyTimestampSkipToday(hour: number, minute: number): number {
  const target = new Date();
  target.setDate(target.getDate() + 1);
  target.setHours(hour, minute, 0, 0);
  return target.getTime();
}

/** WEEKLY: 오늘 회차 무조건 skip. 다음 해당 요일. */
function nextWeeklyTimestampSkipToday(
  hour: number,
  minute: number,
  weekday: number,
): number {
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  const currentDay = target.getDay();
  let diff = weekday - currentDay;
  if (diff <= 0) {
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
 * options.skipToday=true → 오늘 회차 무조건 skip (복용 체크된 schedule용).
 */
export async function scheduleLocalRemindersForMedication(
  schedule: MedicationSchedule,
  options?: { skipToday?: boolean },
): Promise<void> {
  if (!isElderly()) return;
  if (!schedule.active) return;

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

  if (schedule.endDate) {
    // 종료일 있는 약(처방/기간 지정): 종료일까지 '1회성' 알람만 깔고 반복하지 않음.
    // 종료일 이후엔 OS에 알람 자체가 없으므로 앱을 안 열어도 더는 안 울림.
    const now = new Date();
    const today0 = new Date();
    today0.setHours(0, 0, 0, 0);
    const start = schedule.startDate
      ? parseDateOnly(schedule.startDate)
      : today0;
    const end = parseDateOnly(schedule.endDate);
    const fromTime = Math.max(start.getTime(), today0.getTime());

    for (
      const day = new Date(fromTime);
      day.getTime() <= end.getTime();
      day.setDate(day.getDate() + 1)
    ) {
      if (schedule.scheduleType === "WEEKLY") {
        const matches = schedule.daysOfWeek.some(
          (w) => WEEKDAY_INDEX[w] === day.getDay(),
        );
        if (!matches) continue;
      }
      const fire = new Date(day);
      fire.setHours(hour, minute, 0, 0);
      if (fire.getTime() <= now.getTime()) continue; // 지난 회차 skip
      if (options?.skipToday && sameYmd(fire, now)) continue; // 오늘 복용 체크됨

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: fire.getTime(),
        alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE },
      }; // repeatFrequency 없음 = 1회성
      const id = await notifee.createTriggerNotification(
        buildNotification(fire.getTime()),
        trigger,
      );
      notificationIds.push(id);
    }
  } else if (schedule.scheduleType === "DAILY") {
    const timestamp = options?.skipToday
      ? nextDailyTimestampSkipToday(hour, minute)
      : nextDailyTimestamp(hour, minute);
    const trigger = buildAlarmTrigger(timestamp, RepeatFrequency.DAILY);
    const id = await notifee.createTriggerNotification(
      buildNotification(timestamp),
      trigger,
    );
    notificationIds.push(id);
  } else {
    for (const dow of schedule.daysOfWeek) {
      const weekday = WEEKDAY_INDEX[dow];
      const timestamp = options?.skipToday
        ? nextWeeklyTimestampSkipToday(hour, minute, weekday)
        : nextWeeklyTimestamp(hour, minute, weekday);
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
    `[MED-LOCAL] scheduled ${notificationIds.length} alarm(s) for scheduleId=${
      schedule.id
    } (${schedule.medicationName} ${schedule.scheduledTime})${
      options?.skipToday ? " [skipToday]" : ""
    }`,
  );
}

/**
 * 약 일정 1개의 로컬 알람 전부 취소.
 * 매핑이 깨져있어도 OS 기준으로 scheduleId가 일치하는 trigger를 무조건 sweep.
 * 좀비 알람의 근본 차단책.
 */
export async function cancelLocalRemindersForMedication(
  scheduleId: number,
): Promise<void> {
  try {
    const triggers = await notifee.getTriggerNotifications();
    const targetIds = triggers
      .filter(
        (t) =>
          t.notification.data?.type === "MEDICATION_REMINDER" &&
          t.notification.data?.scheduleId === String(scheduleId),
      )
      .map((t) => t.notification.id)
      .filter((id): id is string => !!id);

    for (const id of targetIds) {
      try {
        await notifee.cancelTriggerNotification(id);
      } catch (e) {
        console.warn(`[MED-LOCAL] failed to cancel trigger ${id}:`, e);
      }
    }

    const displayed = await notifee.getDisplayedNotifications();
    for (const d of displayed) {
      const data = d.notification.data;
      if (
        data?.type === "MEDICATION_REMINDER" &&
        data?.scheduleId === String(scheduleId) &&
        d.notification.id
      ) {
        try {
          await notifee.cancelDisplayedNotification(d.notification.id);
        } catch (e) {
          console.warn(
            `[MED-LOCAL] failed to cancel displayed ${d.notification.id}:`,
            e,
          );
        }
      }
    }

    if (targetIds.length > 0) {
      console.log(
        `[MED-LOCAL] OS-swept ${targetIds.length} trigger(s) for scheduleId=${scheduleId}`,
      );
    }
  } catch (e) {
    console.warn("[MED-LOCAL] OS sweep failed:", e);
  }

  const map = await loadMap();
  delete map[scheduleId];
  await saveMap(map);
}

// 동시 sync 호출 직렬화 + 중간 호출은 무시, 마지막 args만 적용
let pendingArgs: {
  schedules: MedicationSchedule[];
  checkedIds: Set<number>;
} | null = null;
let syncRunning = false;

/**
 * 전체 동기화. mutex로 직렬화 + 마지막 호출만 의미 있게 처리.
 * checkedScheduleIds에 포함된 schedule은 skipToday로 등록.
 */
export async function syncAllMedicationReminders(
  schedules: MedicationSchedule[],
  checkedScheduleIds: Set<number> = new Set(),
): Promise<void> {
  if (!isElderly()) return;

  pendingArgs = { schedules, checkedIds: checkedScheduleIds };
  if (syncRunning) return;

  syncRunning = true;
  try {
    while (pendingArgs) {
      const { schedules: current, checkedIds } = pendingArgs;
      pendingArgs = null;

      await clearAllMedicationReminders();
      const activeSchedules = current.filter((s) => s.active);
      for (const schedule of activeSchedules) {
        const skipToday = checkedIds.has(schedule.id);
        await scheduleLocalRemindersForMedication(schedule, { skipToday });
      }
      console.log(
        `[MED-LOCAL] sync complete — ${activeSchedules.length} schedule(s) registered (${checkedIds.size} skipToday)`,
      );
    }
  } finally {
    syncRunning = false;
  }
}

/**
 * 모든 로컬 약 알람 취소 + 매핑 클리어.
 * 매핑 기준 cancel(빠른 경로) + 매핑 외 좀비 sweep(안전망) 이중 동작.
 */
export async function clearAllMedicationReminders(): Promise<void> {
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
