// FCM 푸시 알림 서비스.
//
// 책임 3가지:
//   1) 알림 권한 요청 (Android 13+의 POST_NOTIFICATIONS 다이얼로그 포함)
//   2) FCM 토큰 발급 (Expo 푸시 토큰이 아닌 네이티브 FCM 토큰 — 백엔드 Firebase Admin SDK가 그걸 사용)
//   3) Android 알림 채널 등록 (Android 8+ 필수)
//
// 포그라운드 알림 동작 정책:
//   - 앱이 켜져 있을 때 알림 수신하면 헤드업 배너 표시 + 사운드 + 뱃지
//   - 보호자가 다른 화면 보다가 푸시 받으면 즉시 인지해야 하는 도메인 특성상
//     iOS 기본 동작(조용히 처리)과 다르게 명시적으로 띄워줌

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// ───────────────────────────────────────────────────────
// 포그라운드 알림 핸들러
// 앱이 켜져 있을 때도 시스템 알림 UI를 띄움
// App.tsx 최상단에서 1회만 호출
// ───────────────────────────────────────────────────────
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

// ───────────────────────────────────────────────────────
// Android 알림 채널 등록
// Android 8+ 부터 채널 없이는 알림이 안 뜸. 앱 시작 시 1회 등록.
// ───────────────────────────────────────────────────────
export async function registerAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "보살핌 알림",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3478F6",
  });

  await Notifications.setNotificationChannelAsync("medication", {
    name: "약 복용 알림",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 400, 200, 400], // 강한 진동 (시중 약 알람 표준)
    lightColor: "#FF8A3D",
  });
}

// ───────────────────────────────────────────────────────
// 권한 요청 + FCM 토큰 발급
//
// 반환값 의미:
//   - string: FCM 토큰 발급 성공 (백엔드에 등록 가능)
//   - null: 실기기 아님 / 권한 거부 / 발급 실패
//
// 호출 측은 null이어도 로그인 흐름을 계속 진행해야 함.
// ───────────────────────────────────────────────────────
export async function requestPermissionAndGetFcmToken(): Promise<
  string | null
> {
  // 에뮬레이터에서는 FCM 토큰을 못 받음. 실기기 체크.
  if (!Device.isDevice) {
    console.warn("[FCM] not a physical device — skip token request");
    return null;
  }

  // Android 채널 먼저 (없으면 알림이 안 뜸)
  await registerAndroidNotificationChannel();

  // 현재 권한 상태 확인
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 아직 결정 안 된 상태면 권한 요청 (Android 13+에서 POST_NOTIFICATIONS 다이얼로그 표시)
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[FCM] notification permission denied");
    return null;
  }

  // FCM 토큰 발급. getDevicePushTokenAsync는 Android에서 네이티브 FCM 토큰을 반환.
  // (getExpoPushTokenAsync는 Expo 푸시 서비스용이라 우리 백엔드(Firebase Admin)에 안 맞음)
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
