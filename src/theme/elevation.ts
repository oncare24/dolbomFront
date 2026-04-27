// 그림자 토큰 (Android only).
// Android elevation은 자동으로 적절한 그림자를 그려주므로 수치만 정의.
// 주의: elevation은 backgroundColor가 투명하지 않은 View에서만 보임.

import type { ViewStyle } from "react-native";

type ElevationLevel = "none" | "xs" | "sm" | "md" | "lg";

export const Elevation: Record<ElevationLevel, ViewStyle> = {
  none: { elevation: 0 },
  xs: { elevation: 1 }, // 미세한 깊이감
  sm: { elevation: 2 }, // 카드 기본
  md: { elevation: 4 }, // 강조 카드, FAB
  lg: { elevation: 8 }, // 모달, 바텀시트
};
