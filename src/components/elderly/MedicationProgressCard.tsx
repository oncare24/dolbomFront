// src/components/elderly/MedicationProgressCard.tsx

// 오늘의 복약 진행 카드.
// MedicationTodayScreen 상단에 노출. allDone 시 success bg + 체크 + 격려 메시지.

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";

interface Props {
  totalCount: number;
  takenCount: number;
  allDone: boolean;
}

export function MedicationProgressCard({
  totalCount,
  takenCount,
  allDone,
}: Props) {
  const progress = totalCount > 0 ? takenCount / totalCount : 0;

  if (allDone) {
    return (
      <View
        style={[styles.card, styles.cardDone]}
        accessibilityRole="summary"
        accessibilityLabel={`오늘 약 ${totalCount}회 모두 복용 완료`}
      >
        <Ionicons
          name="checkmark-circle"
          size={44}
          color={Colors.semantic.success}
        />
        <AppText variant="h3" color="primary" style={styles.allDoneText}>
          오늘 약 모두 챙기셨어요
        </AppText>
      </View>
    );
  }

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`오늘 ${totalCount}회 중 ${takenCount}회 복용`}
    >
      <AppText variant="h2" color="primary">
        오늘 {takenCount} / {totalCount}회 복용
      </AppText>
      <View style={styles.track}>
        <View style={[styles.fill, { flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Elevation.sm,
  },
  cardDone: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.semantic.successBg,
  },
  allDoneText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  track: {
    flexDirection: "row",
    height: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray[200],
    overflow: "hidden",
    marginTop: Spacing.md,
  },
  fill: {
    backgroundColor: Colors.brand.primary,
  },
});
