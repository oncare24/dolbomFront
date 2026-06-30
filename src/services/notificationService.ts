import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from "react-native-notify-kit";
import { requestInSequence } from "../utils/permissionQueue";

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as
        | { type?: string }
        | undefined;
      // silent push는 표시 안 함 — 백엔드에서 schedule 동기화용으로만 보냄.
      if (data?.type === "MEDICATION_SCHEDULE_CHANGED") {
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
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

  // notify-kit 약 알람 채널 v3 — sound + 강한 진동.
  //   - 풀스크린 진입 시: 알람 화면이 노래+TTS로 울림(주 경로).
  //   - 풀스크린이 못 뜨는 경우(다른 앱 사용 중 + 권한 미허용): 이 채널 sound가
  //     "무음 배너"가 되지 않도록 보장하는 안전망.
  //   sound 추가는 채널 immutable이라 v2 → v3 ID 교체로 리셋.
  await notifee.createChannel({
    id: "medication_alarm_v3",
    name: "약 복용 알람",
    importance: AndroidImportance.HIGH,
    sound: "default",
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
  await notifee.deleteChannel("medication_alarm_v2").catch(() => {});
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
    const { status } = await requestInSequence(() =>
      Notifications.requestPermissionsAsync(),
    );
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
