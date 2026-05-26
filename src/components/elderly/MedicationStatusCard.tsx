// 오늘의 복약 진행 상태 카드.
// 진행률 표시 + 다음 복용 시간 안내.
// 일정 없음 / 모두 완료 / 진행 중 3가지 상태.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { AppText } from "../common/Text";
import { Colors, Spacing, Radius, Elevation } from "../../theme";
import { haptic } from "../../utils/haptics";
import type { MedicationStatus } from "../../types/elderlyHome";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  status: MedicationStatus;
  onPress: () => void;
}

export function MedicationStatusCard({ status, onPress }: Props) {
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

  const isEmpty = status.totalCount === 0;
  const allDone = !isEmpty && status.takenCount >= status.totalCount;
  const progress =
    status.totalCount > 0 ? status.takenCount / status.totalCount : 0;

  const a11y = isEmpty
    ? "등록된 약이 없어요. 약 추가하기"
    : allDone
    ? "오늘 약 모두 복용 완료"
    : `오늘 약, ${status.takenCount}회 중 ${status.totalCount}회 복용, ${
        status.nextIsOverdue ? "아직 안 드신 약" : "다음"
      } ${status.nextLabel ?? ""} ${status.nextTime ?? ""}`;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: Colors.gray[200], borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={[styles.card, animatedStyle]}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="fitness" size={22} color={Colors.brand.primary} />
        </View>
        <AppText variant="bodyBold" color="primary">
          오늘의 약
        </AppText>
        <View style={styles.spacer} />
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.text.disabled}
        />
      </View>

      {/* 본문 */}
      <View style={styles.body}>
        {isEmpty ? (
          <View style={styles.allDoneRow}>
            <Ionicons
              name="add-circle-outline"
              size={28}
              color={Colors.brand.primary}
            />
            <AppText variant="body" color="primary" style={styles.allDoneText}>
              등록된 약이 없어요
            </AppText>
          </View>
        ) : allDone ? (
          <View style={styles.allDoneRow}>
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={Colors.semantic.success}
            />
            <AppText variant="body" color="primary" style={styles.allDoneText}>
              오늘 약 모두 챙기셨어요
            </AppText>
          </View>
        ) : (
          <>
            <View style={styles.nextRow}>
              <AppText variant="caption" color="secondary">
                {status.nextIsOverdue ? "아직 안 드신 약" : "다음 복용"}
              </AppText>
              <AppText
                variant="bodyBold"
                color="primary"
                style={styles.nextLabel}
              >
                {status.nextLabel}
                {"  "}
                <AppText variant="bodyBold" color="link">
                  {status.nextTime}
                </AppText>
              </AppText>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { flex: progress }]} />
              <View style={{ flex: 1 - progress }} />
            </View>
            <AppText
              variant="caption"
              color="secondary"
              style={styles.progressLabel}
            >
              {status.takenCount}회 / {status.totalCount}회 복용
            </AppText>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Elevation.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  body: {
    minHeight: 60,
  },
  nextRow: {
    marginBottom: Spacing.sm,
  },
  nextLabel: {
    marginTop: 2,
  },
  progressTrack: {
    flexDirection: "row",
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray[200],
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    backgroundColor: Colors.brand.primary,
  },
  progressLabel: {
    textAlign: "right",
  },
  allDoneRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  allDoneText: {
    marginLeft: Spacing.sm,
  },
});
