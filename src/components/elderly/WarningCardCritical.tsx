// 시니어용 매우 주의 경고 카드 (CRITICAL/HIGH).
// severity pill + 타입 라벨 + 약 페어 시각화(효능+제품명) + explanation 본문 + 푸터.
// involvedIngredients를 prescriptions와 매칭해서 효능/제품명 추출.

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import { cleanExplanation } from "../../utils/drugSafety";
import type {
  Prescription,
  Warning,
  WarningType,
} from "../../types/drugSafety";

interface Props {
  warning: Warning;
  prescriptions: Prescription[];
}

const TYPE_LABEL: Record<WarningType, string> = {
  CONTRAINDICATED: "함께 먹으면 위험한 약",
  ELDERLY: "어르신 주의 약물",
  DUPLICATE: "비슷한 효능 약물 중복",
  PREGNANCY: "임신 중 금기 약물",
  OVERDOSE: "복용량 주의",
  DURATION: "복용 기간 주의",
};

interface DrugChip {
  effect: string;
  productName: string;
}

// involvedIngredient를 prescriptions에서 매칭해 효능+제품명 추출.
// - resIngredients(영문 성분) / resDrugName(한글 제품명) 양쪽에서 substring 매칭
// - 매칭 실패 시 ingredient 자체를 productName으로 fallback
function findDrugChip(
  ingredient: string,
  prescriptions: Prescription[],
): DrugChip {
  const lower = ingredient.toLowerCase().trim();
  for (const p of prescriptions) {
    const ingrLower = (p.resIngredients ?? "").toLowerCase();
    const nameLower = (p.resDrugName ?? "").toLowerCase();
    if (
      (ingrLower && ingrLower.includes(lower)) ||
      (nameLower && nameLower.includes(lower)) ||
      (nameLower && lower.includes(nameLower))
    ) {
      return {
        effect: (p.resPrescribeDrugEffect ?? "").trim(),
        productName: (p.resDrugName ?? "").trim() || ingredient,
      };
    }
  }
  return { effect: "", productName: ingredient };
}

export function WarningCardCritical({ warning, prescriptions }: Props) {
  const typeLabel = TYPE_LABEL[warning.type] ?? "주의 사항";
  const chips = warning.involvedIngredients
    .slice(0, 2)
    .map((ing) => findDrugChip(ing, prescriptions));
  const showPair = chips.length === 2;

  return (
    <View style={styles.card}>
      <View style={styles.pill}>
        <AppText variant="caption" audience="elderly" style={styles.pillText}>
          매우 주의
        </AppText>
      </View>

      <AppText variant="h3" audience="elderly" style={styles.title}>
        {typeLabel}
      </AppText>

      {showPair && (
        <View style={styles.pair}>
          <View style={styles.chip}>
            <View style={[styles.chipIcon, styles.chipIconLeft]}>
              <Ionicons
                name="medical"
                size={24}
                color={Colors.semantic.danger}
              />
            </View>
            <AppText
              variant="caption"
              audience="elderly"
              style={styles.chipEffect}
              numberOfLines={2}
            >
              {chips[0].effect || "분류 정보 없음"}
            </AppText>
            <AppText
              variant="caption"
              audience="elderly"
              color="secondary"
              style={styles.chipName}
              numberOfLines={1}
            >
              {chips[0].productName}
            </AppText>
          </View>

          <AppText
            variant="h3"
            audience="elderly"
            color="secondary"
            style={styles.pairX}
          >
            ✕
          </AppText>

          <View style={styles.chip}>
            <View style={[styles.chipIcon, styles.chipIconRight]}>
              <Ionicons name="medical" size={24} color={Colors.semantic.info} />
            </View>
            <AppText
              variant="caption"
              audience="elderly"
              style={styles.chipEffect}
              numberOfLines={2}
            >
              {chips[1].effect || "분류 정보 없음"}
            </AppText>
            <AppText
              variant="caption"
              audience="elderly"
              color="secondary"
              style={styles.chipName}
              numberOfLines={1}
            >
              {chips[1].productName}
            </AppText>
          </View>
        </View>
      )}

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
    backgroundColor: Colors.semantic.dangerBg,
  },
  pillText: {
    color: Colors.semantic.danger,
    fontWeight: "600",
  },
  title: {
    marginTop: Spacing.sm,
  },
  pair: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.surface.background,
    borderRadius: Radius.md,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  chipIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  chipIconLeft: {
    backgroundColor: Colors.semantic.dangerBg,
  },
  chipIconRight: {
    backgroundColor: Colors.semantic.infoBg,
  },
  chipEffect: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  chipName: {
    marginTop: 2,
    textAlign: "center",
  },
  pairX: {
    paddingHorizontal: 4,
  },
  body: {
    marginTop: Spacing.md,
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
