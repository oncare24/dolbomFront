// FCM 토큰 등록 라이프사이클 훅.
//
// 호출 시점: 로그인된 상태로 홈 화면에 진입했을 때.
//   - ElderlyHomeScreen, GuardianHomeScreen 두 곳에서 호출.
//   - useBackgroundLocation과 같은 패턴(enabled 인자로 제어).
//
// 동작:
//   1) 권한 요청 + 토큰 발급
//   2) 백엔드에 PATCH /api/users/me/fcm-token 호출
//   3) 토큰 변경 리스너 등록 (Firebase가 토큰을 회전시키면 자동 재등록)
//
// 실패해도 사용자에게 막지 않음 — 푸시는 보조 기능이고,
// 다음 앱 진입 시 자동 재시도. 로그만 남김.

import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { requestPermissionAndGetFcmToken } from "../services/notificationService";
import { updateFcmToken } from "../services/userService";

export function useFcmTokenRegistration(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    // 1) 최초 토큰 발급 + 백엔드 등록
    (async () => {
      const token = await requestPermissionAndGetFcmToken();
      if (cancelled || !token) return;

      try {
        await updateFcmToken(token);
        console.log("[FCM] token registered to backend");
      } catch (e) {
        console.warn("[FCM] backend registration failed:", e);
      }
    })();

    // 2) 토큰 변경 리스너 (Firebase가 회전시킬 때 자동 재등록)
    const subscription = Notifications.addPushTokenListener(async (token) => {
      if (token.type !== "android") return;
      try {
        await updateFcmToken(token.data);
        console.log("[FCM] token refreshed and re-registered");
      } catch (e) {
        console.warn("[FCM] refresh re-registration failed:", e);
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [enabled]);
}
