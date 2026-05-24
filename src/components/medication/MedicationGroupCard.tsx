// src/components/medication/MedicationGroupCard.tsx
// 약 하나 = 카드 하나. 시간들을 칩으로 모아 표시. audience별 분기.

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
import { Colors, Elevation, Radius, Spacing, Touch } from "../../theme";
import { haptic } from "../../utils/haptics";
import { toKoreanTime } from "../../utils/medicationFormat";
import type { DayOfWeek } from "../../types/medication";
import type { MedicationGroup } from "../../utils/medicationGroup";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  group: MedicationGroup;
  audience: "elderly" | "guardian";
  takenToday: number;
  total: number;
  onPress: () => void;
}

const DOW_KOREAN: Record<DayOfWeek, string> = {
  MONDAY: "월",
  TUESDAY: "화",
  WEDNESDAY: "수",
  THURSDAY: "목",
  FRIDAY: "금",
  SATURDAY: "토",
  SUNDAY: "일",
};

function repeatLabel(group: MedicationGroup): string {
  const base =
    group.scheduleType === "DAILY"
      ? "매일"
      : group.daysOfWeek.map((d) => DOW_KOREAN[d]).join("·");
  return `${base} · 하루 ${group.times.length}번`;
}

function periodLabel(endDate?: string | null): string | null {
  if (!endDate) return null;
  const [, m, d] = endDate.split("-");
  return `${parseInt(m, 10)}월 ${parseInt(d, 10)}일까지`;
}

export function MedicationGroupCard({
  group,
  audience,
  takenToday,
  total,
  onPress,
}: Props) {
  const isElderly = audience === "elderly";
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    haptic.light();
    onPress();
  };

  const repeat = repeatLabel(group);
  const period = periodLabel(group.endDate);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() =>
        (scale.value = withTiming(isElderly ? 0.96 : 0.97, {
          duration: 120,
          easing: Easing.out(Easing.quad),
        }))
      }
      onPressOut={() =>
        (scale.value = withSpring(1, { damping: 14, stiffness: 200 }))
      }
      android_ripple={{ color: Colors.gray[200], borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={`${group.medicationName}, ${repeat}, ${group.times.length}개 시간`}
      style={[
        styles.card,
        isElderly ? styles.cardElderly : styles.cardGuardian,
        animatedStyle,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <AppText
            variant={isElderly ? "h3" : "bodyBold"}
            audience={audience}
            color="primary"
            numberOfLines={2}
          >
            {group.medicationName}
          </AppText>
          <AppText
            variant="caption"
            audience={audience}
            color="secondary"
            style={styles.repeat}
          >
            {period ? `${repeat} · ${period}` : repeat}
          </AppText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={isElderly ? 24 : 20}
          color={Colors.text.disabled}
        />
      </View>

      <View style={styles.chips}>
        {group.times.map((t) => (
          <View
            key={t}
            style={[
              styles.chip,
              isElderly ? styles.chipElderly : styles.chipGuardian,
            ]}
          >
            <AppText
              variant={isElderly ? "body" : "caption"}
              audience={audience}
            >
              {isElderly ? toKoreanTime(t) : t}
            </AppText>
          </View>
        ))}
      </View>

      {takenToday > 0 && (
        <AppText
          variant="caption"
          audience={audience}
          style={{ color: Colors.semantic.success, marginTop: Spacing.sm }}
        >
          {isElderly
            ? `오늘 ${takenToday}번 드심`
            : `오늘 ${takenToday}/${total} 복용`}
        </AppText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    ...Elevation.sm,
  },
  cardElderly: { padding: Spacing.lg, minHeight: Touch.senior + Spacing.md },
  cardGuardian: { padding: Spacing.md, minHeight: Touch.comfortable },
  headerRow: { flexDirection: "row", alignItems: "center" },
  titleWrap: { flex: 1, paddingRight: Spacing.sm },
  repeat: { marginTop: 4 },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  chip: {
    backgroundColor: Colors.surface.background,
    borderRadius: Radius.md,
  },
  chipElderly: { paddingVertical: 8, paddingHorizontal: 14 },
  chipGuardian: { paddingVertical: 5, paddingHorizontal: 11 },
});
