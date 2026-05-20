// src/components/elderly/MedicationItemCard.tsx

// 오늘의 약 카드 1개. 좌측 시간+약이름, 우측 96dp 체크 동그라미.
// isNext: 좌측 brand 컬러 줄 + "다음 복용" 라벨.
// isTaken: opacity 0.55 fade (strike-through 금지 — 행안부 시니어 가이드).
// CheckButton은 이 카드 전용이라 같은 파일 안에 둠.

import React, { useEffect } from "react";
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
import { toKoreanTime } from "../../utils/medicationFormat";
import type { MedicationSchedule } from "../../types/medication";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  schedule: MedicationSchedule;
  isTaken: boolean;
  isNext: boolean;
  onPress: () => void;
}

export function MedicationItemCard({
  schedule,
  isTaken,
  isNext,
  onPress,
}: Props) {
  const showNext = isNext && !isTaken;

  const a11yLabel = [
    toKoreanTime(schedule.scheduledTime),
    schedule.medicationName,
    isTaken ? "복용 완료" : "미복용",
    showNext ? "다음 복용" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View
      style={[styles.card, isTaken && styles.cardTaken]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={a11yLabel}
    >
      {showNext && <View style={styles.nextBar} />}
      <View style={styles.inner}>
        <View style={styles.textWrap}>
          {showNext && (
            <AppText variant="caption" color="link" style={styles.nextLabel}>
              다음 복용
            </AppText>
          )}
          <AppText variant="h3" color="primary">
            {toKoreanTime(schedule.scheduledTime)}
          </AppText>
          <AppText
            variant="body"
            color="secondary"
            style={styles.medName}
            numberOfLines={2}
          >
            {schedule.medicationName}
          </AppText>
        </View>
        <CheckButton isTaken={isTaken} onPress={onPress} />
      </View>
    </View>
  );
}

// ────────────────────────────────────────────
// 96dp 체크 동그라미 — 이 카드 전용
// ────────────────────────────────────────────

function CheckButton({
  isTaken,
  onPress,
}: {
  isTaken: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // 복용 완료 시 미세 펄스로 시각 피드백.
  useEffect(() => {
    if (isTaken) {
      scale.value = withTiming(
        1.08,
        { duration: 120, easing: Easing.out(Easing.quad) },
        () => {
          scale.value = withSpring(1, { damping: 10, stiffness: 200 });
        },
      );
    }
  }, [isTaken, scale]);

  const handlePressIn = () => {
    scale.value = withTiming(0.92, {
      duration: 100,
      easing: Easing.out(Easing.quad),
    });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{
        color: Colors.gray[200],
        borderless: true,
        radius: 52,
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isTaken }}
      accessibilityLabel={isTaken ? "복용 완료" : "복용으로 표시"}
      style={[styles.check, isTaken && styles.checkOn, animatedStyle]}
    >
      {isTaken && (
        <Ionicons name="checkmark" size={48} color={Colors.text.inverse} />
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    overflow: "hidden",
    ...Elevation.sm,
  },
  cardTaken: {
    opacity: 0.55,
  },
  nextBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.brand.primary,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  textWrap: {
    flex: 1,
    gap: 4,
    paddingRight: Spacing.md,
  },
  nextLabel: {
    fontWeight: "700",
    marginBottom: 2,
  },
  medName: {
    marginTop: 2,
  },
  check: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: Colors.gray[300],
    backgroundColor: Colors.surface.card,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: {
    borderColor: Colors.semantic.success,
    backgroundColor: Colors.semantic.success,
  },
});
