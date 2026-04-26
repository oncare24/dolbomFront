// 햅틱(진동) 피드백 헬퍼.
// 사용자가 설정에서 끄면 자동으로 호출 안 됨.
// 매뉴얼 §6.2 햅틱 표준 참조.

import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../stores/settingsStore";

const isEnabled = () => useSettingsStore.getState().hapticEnabled;

export const haptic = {
  // 가벼운 탭 (일반 버튼)
  light: () => {
    if (isEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  // 중간 (토글, 중요한 액션)
  medium: () => {
    if (isEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  // 강함 (SOS, 결정적 액션)
  heavy: () => {
    if (isEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  // 의미 있는 알림 — 성공
  success: () => {
    if (isEnabled())
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  // 의미 있는 알림 — 경고 (안전구역 이탈 등)
  warning: () => {
    if (isEnabled())
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  // 의미 있는 알림 — 에러 (입력 검증 실패 등)
  error: () => {
    if (isEnabled())
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
