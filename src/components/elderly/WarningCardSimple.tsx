// 시니어용 일반 주의 경고 카드 (MEDIUM/LOW).
// CRITICAL과 달리 약 페어 시각화 없음 — explanation 본문만 강조.

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import { cleanExplanation } from "../../utils/drugSafety";
import type { Warning, WarningType } from "../../types/drugSafety";

interface Props {
  warning: Warning;
}

const TYPE_LABEL: Record<WarningType, string> = {
  CONTRAINDICATED: "함께 먹으면 위험한 약",
  ELDERLY: "어르신 주의 약물",
  DUPLICATE: "비슷한 효능 약물 중복",
  PREGNANCY: "임신 중 금기 약물",
  OVERDOSE: "복용량 주의",
  DURATION: "복용 기간 주의",
};

export function WarningCardSimple({ warning }: Props) {
  const typeLabel = TYPE_LABEL[warning.type] ?? "주의 사항";

  return (
    <View style={styles.card}>
      <View style={styles.pill}>
        <AppText variant="caption" audience="elderly" style={styles.pillText}>
          참고
        </AppText>
      </View>

      <AppText variant="h3" audience="elderly" style={styles.title}>
        {typeLabel}
      </AppText>

      <AppText variant="body" audience="elderly" style={styles.body}>
        {cleanExplanation(warning.explanation)}
      </AppText>

      <View style={styles.foot}>
        <Ionicons
          name="medkit-outline"
          size={18}
          color={Colors.text.secondary}
        />
        <AppText variant="caption" audience="elderly" color="secondary">
          의사·약사와 상담해 주세요
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Elevation.sm,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.semantic.infoBg,
  },
  pillText: {
    color: Colors.semantic.info,
    fontWeight: "600",
  },
  title: {
    marginTop: Spacing.sm,
  },
  body: {
    marginTop: Spacing.sm,
  },
  foot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: Colors.surface.divider,
  },
});
