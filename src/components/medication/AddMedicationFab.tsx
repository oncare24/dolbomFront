// src/components/medication/AddMedicationFab.tsx

// 우하단 신규 일정 추가 FAB. audience별 크기 분기.
// elderly: 72dp 시각, guardian: 56dp Material 표준.
// SafeArea bottom 자동 흡수.

import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Colors, Elevation, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  audience: "elderly" | "guardian";
  onPress: () => void;
}

export function AddMedicationFab({ audience, onPress }: Props) {
  const insets = useSafeAreaInsets();
  const isElderly = audience === "elderly";
  const size = isElderly ? 72 : 56;
  const iconSize = isElderly ? 36 : 24;
  const bottomOffset =
    (insets.bottom > 0 ? insets.bottom : Spacing.md) + Spacing.lg;
  const rightOffset = isElderly ? Spacing.lg : Spacing.md;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.92, {
      duration: 100,
      easing: Easing.out(Easing.quad),
    });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };
  const handlePress = () => {
    haptic.medium();
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{
        color: Colors.brand.primaryDark,
        borderless: true,
        radius: size / 2,
      }}
      accessibilityRole="button"
      accessibilityLabel="새 약 추가"
      style={[
        styles.fab,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          bottom: bottomOffset,
          right: rightOffset,
        },
        animatedStyle,
      ]}
    >
      <Ionicons name="add" size={iconSize} color={Colors.text.inverse} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    backgroundColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Elevation.md,
  },
});
