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
const CHANNEL_ID = "medication_alarm_v3";
// 화면 꺼짐/백그라운드에서 울린 알람의 "지금 띄워야 할 시각"을 임시 보관.
// onBackgroundEvent(DELIVERED/PRESS)가 저장 → 앱이 떠오른 뒤 consume 해서 라우팅.
const PENDING_ALARM_KEY = "pending-med-alarm";
const PENDING_ALARM_TTL_MS = 30 * 60 * 1000; // 30분 지난 알람은 무시

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

type ReminderMap = Record<string, string[]>;
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
// ────────────────────────────────────────────
// 슬롯(시각) 단위 알람
//   - 알림은 "이 시각에 약 시간"이라는 사실(data.time)만 담는다.
//   - 어떤 약인지는 알람 화면이 울리는 순간 그날 그 시각 active한 약을 직접 읽어 보여준다.
//   - 같은 시각 약이 여러 개여도 알람은 1개.
// ────────────────────────────────────────────

function slotLabel(hour: number): string {
  if (hour < 11) return "아침";
  if (hour < 17) return "점심";
  if (hour < 21) return "저녁";
  return "밤";
}

function buildSlotNotification(time: string, hour: number) {
  return {
    title: "약 드실 시간이에요",
    body: "드실 약을 확인해 주세요",
    data: {
      type: "MEDICATION_REMINDER",
      time,
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
  };
}

/**
 * 한 시각(슬롯)의 알람 예약.
 * 슬롯 안 약들의 매일/요일/기간을 합쳐 필요한 날에만 알람 1개씩 깐다 (중복·빈 알람 없이).
 */
async function scheduleSlot(
  time: string,
  drugs: MedicationSchedule[],
  skipToday: boolean,
): Promise<string[]> {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const notif = buildSlotNotification(time, hour);
  const ids: string[] = [];

  // 1) 계속 복용 DAILY가 하나라도 있으면 → 매일 반복 알람 1개로 모두 커버.
  const hasDailyContinuous = drugs.some(
    (d) => d.scheduleType === "DAILY" && !d.endDate,
  );
  if (hasDailyContinuous) {
    const ts = skipToday
      ? nextDailyTimestampSkipToday(hour, minute)
      : nextDailyTimestamp(hour, minute);
    const id = await notifee.createTriggerNotification(
      notif,
      buildAlarmTrigger(ts, RepeatFrequency.DAILY),
    );
    return [id];
  }

  // 2) 계속 복용 WEEKLY 요일들 → 요일마다 주간 반복 알람 1개.
  const weeklyDays = new Set<DayOfWeek>();
  for (const d of drugs) {
    if (d.scheduleType === "WEEKLY" && !d.endDate) {
      for (const w of d.daysOfWeek) weeklyDays.add(w);
    }
  }
  for (const w of Array.from(weeklyDays)) {
    const weekday = WEEKDAY_INDEX[w];
    const ts = skipToday
      ? nextWeeklyTimestampSkipToday(hour, minute, weekday)
      : nextWeeklyTimestamp(hour, minute, weekday);
    const id = await notifee.createTriggerNotification(
      notif,
      buildAlarmTrigger(ts, RepeatFrequency.WEEKLY),
    );
    ids.push(id);
  }

  // 3) 기간 약(종료일 있음) → 필요한 날짜마다 1회성 알람.
  //    위 주간 반복이 이미 커버하는 요일은 건너뜀(중복 방지).
  const now = new Date();
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const oneShotDates = new Set<number>(); // 자정 timestamp로 날짜 중복 제거

  for (const d of drugs) {
    if (!d.endDate) continue;
    const start = d.startDate ? parseDateOnly(d.startDate) : today0;
    const end = parseDateOnly(d.endDate);
    const from = Math.max(start.getTime(), today0.getTime());

    for (
      const day = new Date(from);
      day.getTime() <= end.getTime();
      day.setDate(day.getDate() + 1)
    ) {
      if (d.scheduleType === "WEEKLY") {
        const matches = d.daysOfWeek.some(
          (w) => WEEKDAY_INDEX[w] === day.getDay(),
        );
        if (!matches) continue;
      }
      const coveredByWeekly = Array.from(weeklyDays).some(
        (w) => WEEKDAY_INDEX[w] === day.getDay(),
      );
      if (coveredByWeekly) continue;

      const key = new Date(day);
      key.setHours(0, 0, 0, 0);
      oneShotDates.add(key.getTime());
    }
  }

  for (const dateTs of Array.from(oneShotDates)) {
    const fire = new Date(dateTs);
    fire.setHours(hour, minute, 0, 0);
    if (fire.getTime() <= now.getTime()) continue; // 지난 회차 skip
    if (skipToday && sameYmd(fire, now)) continue; // 오늘 복용 완료
    const id = await notifee.createTriggerNotification(notif, {
      type: TriggerType.TIMESTAMP,
      timestamp: fire.getTime(),
      alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE },
    }); // repeatFrequency 없음 = 1회성
    ids.push(id);
  }

  return ids;
}

// 동시 sync 호출 직렬화 + 중간 호출은 무시, 마지막 args만 적용
let pendingArgs: {
  schedules: MedicationSchedule[];
  checkedIds: Set<number>;
} | null = null;
let syncRunning = false;

/**
 * 전체 동기화. 같은 시각 약들을 묶어 시각마다 알람 1개씩 예약.
 * mutex로 직렬화 + 마지막 호출만 의미 있게 처리.
 * checkedScheduleIds: 오늘 이미 복용한 schedule id. 그 시각 약이 전부 복용 완료면 오늘 회차 skip.
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

      const active = current.filter((s) => s.active);

      // 같은 시각끼리 묶기
      const byTime = new Map<string, MedicationSchedule[]>();
      for (const s of active) {
        const list = byTime.get(s.scheduledTime) ?? [];
        list.push(s);
        byTime.set(s.scheduledTime, list);
      }

      const map: ReminderMap = {};
      for (const [time, drugs] of Array.from(byTime)) {
        const slotSkipToday = drugs.every((d) => checkedIds.has(d.id));
        const slotIds = await scheduleSlot(time, drugs, slotSkipToday);
        if (slotIds.length > 0) map[time] = slotIds;
      }
      await saveMap(map);

      console.log(
        `[MED-LOCAL] sync complete — ${byTime.size} time-slot(s) registered`,
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
      .filter((t) => t.notification.data?.snooze !== "true") // 스누즈는 sweep 면제
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

/**
 * "지금은 어려워요" → 10분 뒤 1회성 재알람.
 * 원래 시각(time)을 그대로 실어 → 알람 화면이 그 시각 약을 다시 찾게 함.
 * data.snooze="true" 로 표시 → 동기화 sweep 에서 면제(안 지워짐).
 */
export async function scheduleMedicationSnooze(time: string): Promise<void> {
  if (!isElderly()) return;
  const SNOOZE_MINUTES = 10;
  const hour = parseInt(time.split(":")[0], 10);
  const base = buildSlotNotification(time, hour);
  const notif = { ...base, data: { ...base.data, snooze: "true" } };
  await notifee.createTriggerNotification(notif, {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + SNOOZE_MINUTES * 60 * 1000,
    alarmManager: { type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE },
  }); // repeatFrequency 없음 = 1회성
}

// ────────────────────────────────────────────
// 잠금/백그라운드 알람 라우팅용 pending 시각
//   - getInitialNotification은 FSI 자동실행을 press로 안 보고 null을 주고,
//     onForegroundEvent도 백그라운드 delivered를 못 잡는다.
//   - 그래서 onBackgroundEvent(DELIVERED/PRESS)가 시각을 여기에 저장하고,
//     앱이 인증 복원까지 끝낸 뒤 consume 해서 풀스크린 알람 화면으로 라우팅한다.
// ────────────────────────────────────────────

/** 화면 꺼짐/백그라운드에서 알람이 울리면(또는 눌리면) 그 시각을 저장. */
export async function setPendingAlarm(time: string): Promise<void> {
  try {
    await AsyncStorage.setItem(
      PENDING_ALARM_KEY,
      JSON.stringify({ time, ts: Date.now() }),
    );
  } catch (e) {
    console.warn("[MED-ALARM] setPendingAlarm failed:", e);
  }
}

/** 저장된 pending 알람 시각을 읽고 비운다. 없거나 30분 지났으면 null. */
export async function consumePendingAlarm(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_ALARM_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(PENDING_ALARM_KEY);
    const { time, ts } = JSON.parse(raw) as { time?: string; ts?: number };
    if (!time || !ts) return null;
    if (Date.now() - ts > PENDING_ALARM_TTL_MS) return null;
    return time;
  } catch {
    return null;
  }
}

/** pending 알람 제거 (복용 완료/스누즈 등으로 더 안 띄울 때). */
export async function clearPendingAlarm(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_ALARM_KEY);
  } catch {
    /* 무시 */
  }
}
