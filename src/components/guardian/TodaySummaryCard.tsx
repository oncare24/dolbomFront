// src/components/guardian/TodaySummaryCard.tsx

// 오늘의 요약 단일 카드 — 아이콘 + 숫자 + 라벨 + (옵션) 보조 힌트.
// 데이터 미준비 시 disabled=true + hint="준비 중" 표시 권장.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type CardTone = "primary" | "neutral" | "muted";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  hint?: string;
  tone?: CardTone;
  onPress?: () => void;
  disabled?: boolean;
}

function toneColors(tone: CardTone): { bg: string; fg: string } {
  switch (tone) {
    case "primary":
      return {
        bg: Colors.brand.primaryLight,
        fg: Colors.brand.primary,
      };
    case "neutral":
      return {
        bg: "#F0F4F8",
        fg: Colors.text.primary,
      };
    case "muted":
    default:
      return {
        bg: Colors.gray[100],
        fg: Colors.text.disabled,
      };
  }
}

export function TodaySummaryCard({
  icon,
  label,
  value,
  hint,
  tone = "primary",
  onPress,
  disabled,
}: Props) {
  const colors = toneColors(tone);
  const interactive = !!onPress && !disabled;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!interactive) return;
    scale.value = withTiming(0.97, {
      duration: 120,
      easing: Easing.out(Easing.quad),
    });
  };
  const handlePressOut = () => {
    if (!interactive) return;
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
  };
  const handlePress = () => {
    if (!interactive) return;
    haptic.light();
    onPress?.();
  };

  return (
    <AnimatedPressable
      onPress={interactive ? handlePress : undefined}
      onPressIn={interactive ? handlePressIn : undefined}
      onPressOut={interactive ? handlePressOut : undefined}
      disabled={!interactive}
      android_ripple={
        interactive ? { color: Colors.gray[200], borderless: false } : undefined
      }
      accessibilityRole={interactive ? "button" : "text"}
      accessibilityLabel={`${label} ${value}${hint ? ` ${hint}` : ""}`}
      accessibilityState={disabled ? { disabled: true } : undefined}
      style={[styles.card, disabled && styles.cardDisabled, animatedStyle]}
    >
      <View
        style={[styles.iconWrap, { backgroundColor: colors.bg }]}
        accessible={false}
      >
        <Ionicons name={icon} size={22} color={colors.fg} />
      </View>

      <AppText
        variant="bodyBold"
        audience="guardian"
        style={[styles.value, disabled && styles.valueDisabled]}
      >
        {value}
      </AppText>

      <AppText
        variant="caption"
        audience="guardian"
        color="secondary"
        style={styles.label}
        numberOfLines={1}
      >
        {label}
      </AppText>

      {hint && (
        <AppText
          variant="caption"
          audience="guardian"
          color="secondary"
          style={styles.hint}
        >
          {hint}
        </AppText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 140,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
    gap: 4,
    ...Elevation.sm,
  },
  cardDisabled: {
    opacity: 0.65,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  valueDisabled: {
    color: Colors.text.disabled,
  },
  label: {
    textAlign: "center",
  },
  hint: {
    marginTop: 2,
    fontSize: 11,
  },
});
