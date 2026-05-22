// src/components/medication/MedicationScheduleCard.tsx

// 복약 일정 카드 1개. audience별 폰트·터치·패딩 분기.
// 탭 → 편집 화면 진입. 길게누름·스와이프 없음 (시니어 친화 + E 화면에서 삭제 처리).

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
import type { DayOfWeek, MedicationSchedule } from "../../types/medication";
import type { MedicationTodayStatus } from "../../utils/medicationStatus";
import { takenAtToTimeLabel } from "../../utils/medicationStatus";
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  schedule: MedicationSchedule;
  audience: "elderly" | "guardian";
  todayStatus?: MedicationTodayStatus;
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

const DOW_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function formatRepeat(schedule: MedicationSchedule): string {
  if (schedule.scheduleType === "DAILY") return "매일";
  const sorted = DOW_ORDER.filter((d) => schedule.daysOfWeek.includes(d));
  return sorted.map((d) => DOW_KOREAN[d]).join("·");
}

export function MedicationScheduleCard({
  schedule,
  audience,
  todayStatus,
  onPress,
}: Props) {
  const isElderly = audience === "elderly";
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, {
      duration: 120,
      easing: Easing.out(Easing.quad),
    });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
  };
  const handlePress = () => {
    haptic.light();
    onPress();
  };

  const timeLabel = isElderly
    ? toKoreanTime(schedule.scheduledTime)
    : schedule.scheduledTime;
  const repeatLabel = formatRepeat(schedule);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: Colors.gray[200], borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={`${timeLabel}, ${schedule.medicationName}, ${repeatLabel}`}
      style={[
        styles.card,
        isElderly ? styles.cardElderly : styles.cardGuardian,
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textWrap}>
          <AppText
            variant={isElderly ? "h3" : "bodyBold"}
            audience={audience}
            color="primary"
          >
            {timeLabel}
          </AppText>
          <AppText
            variant="body"
            audience={audience}
            color="secondary"
            style={styles.medName}
            numberOfLines={2}
          >
            {schedule.medicationName}
          </AppText>
          <AppText
            variant="caption"
            audience={audience}
            color="secondary"
            style={styles.repeat}
          >
            {repeatLabel}
          </AppText>
        </View>
        {todayStatus?.kind === "TAKEN" && (
          <View style={[styles.badge, styles.badgeTaken]}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={Colors.semantic.success}
            />
            <AppText style={styles.badgeTakenText}>
              {takenAtToTimeLabel(todayStatus.takenAt)} 드심
            </AppText>
          </View>
        )}
        {todayStatus?.kind === "MISSED" && (
          <View style={[styles.badge, styles.badgeMissed]}>
            <Ionicons
              name="alert-circle"
              size={14}
              color={Colors.semantic.danger}
            />
            <AppText style={styles.badgeMissedText}>놓침</AppText>
          </View>
        )}
        <Ionicons
          name="chevron-forward"
          size={isElderly ? 24 : 20}
          color={Colors.text.disabled}
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    ...Elevation.sm,
  },
  cardElderly: {
    padding: Spacing.lg,
    minHeight: Touch.senior + Spacing.md,
  },
  cardGuardian: {
    padding: Spacing.md,
    minHeight: Touch.comfortable + Spacing.sm,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  textWrap: {
    flex: 1,
    gap: 4,
    paddingRight: Spacing.sm,
  },
  medName: {
    marginTop: 2,
  },
  repeat: {
    marginTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
    marginRight: Spacing.sm,
  },
  badgeTaken: {
    backgroundColor: Colors.semantic.successBg,
  },
  badgeTakenText: {
    color: Colors.semantic.success,
    fontSize: 12,
    fontWeight: "600",
  },
  badgeMissed: {
    backgroundColor: Colors.semantic.dangerBg,
  },
  badgeMissedText: {
    color: Colors.semantic.danger,
    fontSize: 12,
    fontWeight: "600",
  },
});
