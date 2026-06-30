// 복약 풀스크린 알람에 필요한 모든 권한의 상태 확인 + 요청을 한 곳에서 관리.
//
// 권한 종류 (Android):
//   1) notifications     — 알림 표시 (POST_NOTIFICATIONS)
//   2) fullScreenIntent  — 전체 화면 알림 (USE_FULL_SCREEN_INTENT, 14+ 별도 허용)
//   3) overlay           — 다른 앱 위에 표시 (SYSTEM_ALERT_WINDOW) → 다른 앱 중에도 풀스크린
//   4) exactAlarm        — 정확한 알람 (SCHEDULE_EXACT_ALARM)
//   5) battery           — 배터리 최적화 제외 (절전 모드에서도 알람)
//
// notifications/exactAlarm 외에는 OS가 "시스템 설정 화면"으로만 토글을 허용하므로,
// 요청 = 해당 설정 화면 열기. 사용자가 켜고 돌아오면 다시 check 해서 상태 갱신.

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import notifee from "react-native-notify-kit";
import { requestInSequence } from "../utils/permissionQueue";
import {
  canDrawOverlays,
  openOverlaySettings,
  canUseFullScreenIntent,
  openFullScreenIntentSettings,
  isIgnoringBatteryOptimizations,
  openBatteryOptimizationSettings,
} from "../../modules/alarm-kit";

export type PermKey =
  | "notifications"
  | "fullScreenIntent"
  | "overlay"
  | "exactAlarm"
  | "battery";

export interface PermItem {
  key: PermKey;
  title: string;
  description: string;
  /** 풀스크린 알람이 제대로 뜨려면 반드시 필요한 권한인지. */
  critical: boolean;
}

// 화면에 보여줄 순서 = 중요도 순.
export const PERMISSION_ITEMS: PermItem[] = [
  {
    key: "notifications",
    title: "알림 표시",
    description: "약 드실 시간을 알려드려요.",
    critical: true,
  },
  {
    key: "fullScreenIntent",
    title: "전체 화면 알림",
    description: "화면이 꺼져 있어도 알람 화면을 크게 띄워요.",
    critical: true,
  },
  {
    key: "overlay",
    title: "다른 앱 위에 표시",
    description: "다른 앱을 사용하는 중에도 알람 화면을 띄워요.",
    critical: true,
  },
  {
    key: "exactAlarm",
    title: "정확한 알람",
    description: "정해진 시간에 정확히 알려드려요.",
    critical: true,
  },
  {
    key: "battery",
    title: "배터리 사용 제한 없음",
    description: "절전 모드에서도 알람을 놓치지 않아요.",
    critical: false,
  },
];

/** 개별 권한 허용 여부. (Android 외에는 항상 true) */
export async function checkPermission(key: PermKey): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  switch (key) {
    case "notifications": {
      const { status } = await Notifications.getPermissionsAsync();
      return status === "granted";
    }
    case "exactAlarm": {
      const s = await notifee.getNotificationSettings();
      return s.android.alarm === 1; // ENABLED = 1
    }
    case "fullScreenIntent":
      return canUseFullScreenIntent();
    case "overlay":
      return canDrawOverlays();
    case "battery":
      return isIgnoringBatteryOptimizations();
  }
}

/** 모든 권한 상태를 한 번에. */
export async function checkAllPermissions(): Promise<Record<PermKey, boolean>> {
  const entries = await Promise.all(
    PERMISSION_ITEMS.map(
      async (i) => [i.key, await checkPermission(i.key)] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<PermKey, boolean>;
}

/** 개별 권한 요청 (OS 다이얼로그 또는 설정 화면 열기). */
export async function requestPermission(key: PermKey): Promise<void> {
  if (Platform.OS !== "android") return;
  switch (key) {
    case "notifications": {
      // 권한 팝업은 직렬화 큐를 통과시켜 다른 요청과 겹치지 않게.
      await requestInSequence(() => Notifications.requestPermissionsAsync());
      await notifee.requestPermission();
      return;
    }
    case "exactAlarm":
      await notifee.openAlarmPermissionSettings();
      return;
    case "fullScreenIntent":
      openFullScreenIntentSettings();
      return;
    case "overlay":
      openOverlaySettings();
      return;
    case "battery":
      openBatteryOptimizationSettings();
      return;
  }
}

/** 풀스크린 알람에 필수인 권한 중 하나라도 빠졌으면 true. */
export async function hasMissingCriticalPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  for (const item of PERMISSION_ITEMS) {
    if (!item.critical) continue;
    if (!(await checkPermission(item.key))) return true;
  }
  return false;
}
