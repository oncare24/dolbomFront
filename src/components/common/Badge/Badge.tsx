import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { AppText } from "../Text";
import { Colors, Spacing, Radius } from "../../../theme";

type BadgeVariant = "danger" | "warning" | "success" | "info" | "neutral";
type BadgeSize = "dot" | "small" | "medium";

interface BadgeProps {
  // dot 사이즈는 children 없이 빈 원만 표시. 그 외는 children 텍스트 표시.
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: StyleProp<ViewStyle>;
}

/**
 * Badge
 * - dot: 알림 점(8dp 원). 보통 아이콘 우상단에 절대 위치로 배치.
 * - small: 작은 라벨 (16dp 높이)
 * - medium: 큰 라벨 (24dp 높이) — 시니어 화면 권장
 */
export function Badge({
  children,
  variant = "danger",
  size = "medium",
  style,
}: BadgeProps) {
  const colorPair = COLOR_MAP[variant];
  const sizeStyle = SIZE_MAP[size];

  if (size === "dot") {
    return (
      <View style={[styles.dot, { backgroundColor: colorPair.bg }, style]} />
    );
  }

  return (
    <View
      style={[
        styles.base,
        sizeStyle.container,
        { backgroundColor: colorPair.bg },
        style,
      ]}
    >
      <AppText
        variant="caption"
        style={{
          color: colorPair.text,
          fontSize: sizeStyle.fontSize,
          lineHeight: sizeStyle.lineHeight,
          fontWeight: "600",
        }}
        maxScale={1.2}
        numberOfLines={1}
      >
        {children}
      </AppText>
    </View>
  );
}

const COLOR_MAP: Record<BadgeVariant, { bg: string; text: string }> = {
  danger: { bg: Colors.semantic.danger, text: Colors.text.inverse },
  warning: { bg: Colors.semantic.warning, text: Colors.text.inverse },
  success: { bg: Colors.semantic.success, text: Colors.text.inverse },
  info: { bg: Colors.semantic.info, text: Colors.text.inverse },
  neutral: { bg: Colors.gray[200], text: Colors.text.primary },
};

const SIZE_MAP = {
  dot: { container: {}, fontSize: 0, lineHeight: 0 },
  small: {
    container: { paddingHorizontal: Spacing.xs, height: 20 },
    fontSize: 12,
    lineHeight: 20,
  },
  medium: {
    container: { paddingHorizontal: Spacing.sm, height: 28 },
    fontSize: 14,
    lineHeight: 28,
  },
} as const;

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
});
