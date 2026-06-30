// 복약 풀스크린 알람용 네이티브 모듈 (Android 전용) JS 래퍼.
//
// 네이티브 모듈이 없는 빌드(예: 네이티브 재빌드 전 OTA 상태, iOS)에서는
// requireOptionalNativeModule이 null을 주므로, 권한 체크는 "허용됨(true)"으로,
// 동작 함수는 no-op으로 안전하게 떨어진다 → 앱이 죽지 않는다.

import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";

type AlarmKitNative = {
  canDrawOverlays(): boolean;
  openOverlaySettings(): void;
  canUseFullScreenIntent(): boolean;
  openFullScreenIntentSettings(): void;
  isIgnoringBatteryOptimizations(): boolean;
  openBatteryOptimizationSettings(): void;
  launchAlarmActivity(): void;
};

const native =
  Platform.OS === "android"
    ? requireOptionalNativeModule<AlarmKitNative>("AlarmKit")
    : null;

/** 네이티브 모듈이 실제로 빌드에 포함됐는지. (재빌드 전이면 false) */
export const isAlarmKitAvailable = native != null;

/** "다른 앱 위에 표시"(SYSTEM_ALERT_WINDOW) 허용 여부. */
export function canDrawOverlays(): boolean {
  return native?.canDrawOverlays() ?? true;
}

/** "다른 앱 위에 표시" 설정 화면 열기. */
export function openOverlaySettings(): void {
  native?.openOverlaySettings();
}

/** "전체 화면 알림"(USE_FULL_SCREEN_INTENT) 허용 여부. */
export function canUseFullScreenIntent(): boolean {
  return native?.canUseFullScreenIntent() ?? true;
}

/** "전체 화면 알림" 설정 화면 열기 (Android 14+). */
export function openFullScreenIntentSettings(): void {
  native?.openFullScreenIntentSettings();
}

/** 배터리 최적화 제외(제한 없음) 여부. */
export function isIgnoringBatteryOptimizations(): boolean {
  return native?.isIgnoringBatteryOptimizations() ?? true;
}

/** 배터리 최적화 제외 요청 다이얼로그/설정 열기. */
export function openBatteryOptimizationSettings(): void {
  native?.openBatteryOptimizationSettings();
}

/** 다른 앱 사용 중/홈 화면이어도 알람 액티비티를 앞으로 끌어올림. */
export function launchAlarmActivity(): void {
  native?.launchAlarmActivity();
}
