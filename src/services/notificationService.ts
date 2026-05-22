import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from "react-native-notify-kit";

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  // expo-notifications 기본 채널 (보호자 알림, SOS 등 일반 알림용)
  await Notifications.setNotificationChannelAsync("default", {
    name: "보살핌 알림",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3478F6",
  });

  // notify-kit 약 알람 채널 v2 — sound 없이 진동 + 풀스크린만.
  // sound는 풀스크린 진입 후 TTS가 대신 (무음/벨소리 OFF/DND 상태 모두 무관).
  // Android NotificationChannel sound는 immutable이라 v1 → v2 ID 교체로 리셋.
  await notifee.createChannel({
    id: "medication_alarm_v2",
    name: "약 복용 알람",
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    bypassDnd: true,
    visibility: AndroidVisibility.PUBLIC,
    lights: true,
    lightColor: "#FF8A3D",
  });

  // 옛 채널 cleanup
  await Notifications.deleteNotificationChannelAsync("medication").catch(
    () => {},
  );
  await notifee.deleteChannel("medication_alarm").catch(() => {});
}

export async function requestPermissionAndGetFcmToken(): Promise<
  string | null
> {
  if (!Device.isDevice) {
    console.warn("[FCM] not a physical device — skip token request");
    return null;
  }

  await registerAndroidNotificationChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[FCM] notification permission denied");
    return null;
  }

  // notifee 권한 (Android 13+ POST_NOTIFICATIONS + USE_FULL_SCREEN_INTENT)
  await notifee.requestPermission();

  try {
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    if (tokenResponse.type !== "android") {
      console.warn("[FCM] unexpected token type:", tokenResponse.type);
      return null;
    }
    console.log(
      "[FCM] token issued:",
      tokenResponse.data.substring(0, 12) + "...",
    );
    return tokenResponse.data;
  } catch (e) {
    console.warn("[FCM] failed to get device push token:", e);
    return null;
  }
}

/** 정확한 알람 권한(SCHEDULE_EXACT_ALARM) 확인. false면 시스템 설정으로 안내 가능. */
export async function checkExactAlarmPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  const settings = await notifee.getNotificationSettings();
  return settings.android.alarm === 1; // ENABLED = 1
}

/** 정확한 알람 권한 설정 화면 열기. */
export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS !== "android") return;
  await notifee.openAlarmPermissionSettings();
}
