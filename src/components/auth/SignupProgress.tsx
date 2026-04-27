// 회원가입 상단 진행률 바.
// 시니어 UX: 진행 상황을 시각적으로 명확히 표시 → 불안감 감소.
// 부드러운 너비 애니메이션 (220ms).

import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { AppText } from "../common/Text";
import { Colors, Spacing, Radius } from "../../theme";

interface SignupProgressProps {
  currentStep: number; // 1-indexed
  totalSteps: number;
}

export function SignupProgress({
  currentStep,
  totalSteps,
}: SignupProgressProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(currentStep / totalSteps, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentStep, totalSteps]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <AppText variant="caption" color="secondary" maxScale={1.3}>
          {currentStep}단계 / 총 {totalSteps}단계
        </AppText>
      </View>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: totalSteps,
          now: currentStep,
        }}
        accessibilityLabel={`회원가입 진행 ${currentStep}단계 중 ${totalSteps}단계`}
      >
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: Spacing.xs,
  },
  track: {
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray[200],
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary,
  },
});
