// src/components/guardian/TodaySummaryRow.tsx

// "오늘의 요약" 섹션 — 2개 카드(복약/이상 감지) 가로 배치.
// 미준비 데이터는 null 전달 → 카드 자동 비활성 + "준비 중" 표시.

import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../common/Text";
import { TodaySummaryCard } from "./TodaySummaryCard";
import { Spacing } from "../../theme";

interface Props {
  medTakenCount: number;
  medTotalCount: number;
  /** null = 데이터 미준비 */
  anomalyCount: number | null;
  onMedPress?: () => void;
}

export function TodaySummaryRow({
  medTakenCount,
  medTotalCount,
  anomalyCount,
  onMedPress,
}: Props) {
  const hasMed = medTotalCount > 0;

  return (
    <View style={styles.wrap}>
      <AppText
        variant="bodyBold"
        audience="guardian"
        color="primary"
        style={styles.title}
      >
        오늘의 요약
      </AppText>

      <View style={styles.row}>
        <TodaySummaryCard
          icon="medkit"
          label="복약"
          value={hasMed ? `${medTakenCount}/${medTotalCount}` : "—"}
          hint={hasMed ? undefined : "일정 없음"}
          tone="primary"
          onPress={onMedPress}
        />

        <TodaySummaryCard
          icon="shield-checkmark"
          label="이상 감지"
          value={anomalyCount === null ? "—" : `${anomalyCount}건`}
          hint={anomalyCount === null ? "준비 중" : undefined}
          tone={anomalyCount === null ? "muted" : "neutral"}
          disabled={anomalyCount === null}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
});
