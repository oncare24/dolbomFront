// src/components/elderly/MedicationSlotCard.tsx

// 오늘의 약 — 한 시각(회차) 카드.
// 그 시각에 먹을 약을 모두 묶어 보여주고, 체크를 누르면 그 시각 약 전부 복용 표시.
// MedicationItemCard와 같은 스타일(96dp 체크, 다음 바, 완료 fade) 사용.

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function slotLabel(time: string): string {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 11) return "아침";
  if (hour < 17) return "점심";
  if (hour < 21) return "저녁";
  return "밤";
}

interface Props {
  time: string;
  medicationNames: string[];
  isTaken: boolean;
  isNext: boolean;
  onPress: () => void;
}

export function MedicationSlotCard({
  time,
  medicationNames,
  isTaken,
  isNext,
  onPress,
}: Props) {
  const showNext = isNext && !isTaken;
  const namesText = medicationNames.join(" · ");

  const a11yLabel = [
    `${toKoreanTime(time)}`,
    namesText,
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
            {toKoreanTime(time)}
          </AppText>
          <AppText
            variant="body"
            color="secondary"
            style={styles.medName}
            numberOfLines={3}
          >
            {namesText}
          </AppText>
        </View>
        <CheckButton isTaken={isTaken} onPress={onPress} />
      </View>
    </View>
  );
}

// ────────────────────────────────────────────
// 96dp 체크 동그라미 — 이 카드 전용 (MedicationItemCard와 동일 동작)
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
