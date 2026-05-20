// src/components/common/BottomActionBar/BottomActionBar.tsx

// 화면 하단 고정 액션 영역.
// - SafeArea bottom inset 자동 흡수 (제스처 네비/홈 인디케이터 회피)
// - audience별 좌우 패딩 자동
// - 위쪽 구분선 (스크롤 끝과 시각 분리)
// - 모든 폰 일관된 최소 여백 보장 (Math.max(insets.bottom, Spacing.lg))

import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, ScreenPadding, Spacing } from "../../../theme";

interface BottomActionBarProps {
  children: React.ReactNode;
  audience?: "elderly" | "guardian";
  showDivider?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BottomActionBar({
  children,
  audience = "elderly",
  showDivider = true,
  style,
}: BottomActionBarProps) {
  const insets = useSafeAreaInsets();
  const padding = ScreenPadding[audience];

  return (
    <View
      style={[
        styles.bar,
        showDivider && styles.divider,
        {
          paddingHorizontal: padding.horizontal,
          paddingTop: Spacing.md,
          paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface.background,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Colors.surface.divider,
  },
});
