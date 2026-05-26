// src/components/guardian/TodaySummaryRow.tsx

// "오늘의 요약" 섹션 — 2개 카드(복약/이상 감지) 가로 배치.
// 미준비 데이터는 null 전달 → 카드 자동 비활성 + "준비 중" 표시.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { TodaySummaryCard } from "./TodaySummaryCard";
import { Colors, Radius, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";

interface Props {
  medTakenCount: number;
  medTotalCount: number;
  /** 마감 지난 미복용 회차 수 */
  medMissedCount: number;
  /** null = 데이터 미준비 */
  anomalyCount: number | null;
  onMedPress?: () => void;
  /** "이상 감지" 카드 탭 → 이상감지 기록 화면. anomalyCount 가 null 이면 카드가 비활성. */
  onAnomalyPress?: () => void;
}

export function TodaySummaryRow({
  medTakenCount,
  medTotalCount,
  medMissedCount,
  anomalyCount,
  onMedPress,
  onAnomalyPress,
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
          onPress={onAnomalyPress}
        />
      </View>

      {medMissedCount > 0 && (
        <Pressable
          onPress={() => {
            haptic.light();
            onMedPress?.();
          }}
          android_ripple={{ color: Colors.gray[200], borderless: false }}
          accessibilityRole="button"
          accessibilityLabel={`안 드신 약 ${medMissedCount}건, 복약 일정 확인하기`}
          style={styles.missedBanner}
        >
          <Ionicons
            name="alert-circle"
            size={18}
            color={Colors.semantic.warning}
          />
          <AppText
            variant="caption"
            audience="guardian"
            style={styles.missedText}
          >
            안 드신 약 {medMissedCount}건 · 확인하기
          </AppText>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.semantic.warning}
          />
        </Pressable>
      )}
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
  missedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.semantic.warningBg,
    borderRadius: Radius.md,
  },
  missedText: {
    flex: 1,
    color: Colors.semantic.warning,
    fontWeight: "600",
  },
});
