import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { Colors, Spacing, Radius, Elevation } from "../../../theme";
import { haptic } from "../../../utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = "default" | "elevated" | "outlined";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Card
 * - 시니어 화면 기본 컨테이너. 홈 화면 액션 카드, 정보 표시 등에 사용.
 * - onPress 있으면 자동으로 누름 피드백 + 햅틱 + 접근성 role 부여.
 * - variant:
 *   - default: 그림자 없는 평면 카드 (단순 정보 표시)
 *   - elevated: 그림자 있는 카드 (홈 메인 액션)
 *   - outlined: 테두리만 (보조 정보)
 */
export function Card({
  children,
  onPress,
  variant = "default",
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!onPress || disabled) return;
    scale.value = withTiming(0.98, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    haptic.light();
    onPress?.();
  };

  const variantStyle = styles[variant];

  // onPress 없으면 그냥 View
  if (!onPress) {
    return (
      <View
        style={[styles.base, variantStyle, disabled && styles.disabled, style]}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      android_ripple={{ color: Colors.gray[200], borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        variantStyle,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    overflow: "hidden",
  },
  default: {
    backgroundColor: Colors.surface.card,
  },
  elevated: {
    backgroundColor: Colors.surface.card,
    ...Elevation.sm,
  },
  outlined: {
    backgroundColor: Colors.surface.card,
    borderWidth: 1.5,
    borderColor: Colors.surface.divider,
  },
  disabled: {
    opacity: 0.5,
  },
});
