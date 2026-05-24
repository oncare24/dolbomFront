// 보호자용 경고 카드 (상세 표시).
//
// 피보호자용(MedicationWarningCard) 과의 차이:
//  - involvedIngredients 칩 표시
//  - rawMessage(원본 의학 메시지) 노출
//  - 더 작은 글씨, 더 많은 정보

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import type {
  Warning,
  WarningSeverity,
  WarningType,
} from "../../types/drugSafety";
import { isIndirectRisk } from "../../utils/drugSafety";
import { DrugNameChips } from "../common/DrugNameChips";

interface Props {
  warning: Warning;
  onPressDrug?: (drugName: string) => void;
}

const TYPE_LABEL: Record<WarningType, string> = {
  CONTRAINDICATED: "병용금기",
  ELDERLY: "노인주의",
  DUPLICATE: "효능군 중복",
  PREGNANCY: "임부금기",
  OVERDOSE: "용량주의",
  DURATION: "투여기간 주의",
};

interface SeverityVisual {
  bar: string;
  pillBg: string;
  pillText: string;
  label: string;
}

function severityVisual(severity: WarningSeverity): SeverityVisual {
  switch (severity) {
    case "CRITICAL":
      return {
        bar: Colors.semantic.danger,
        pillBg: Colors.semantic.dangerBg,
        pillText: Colors.semantic.danger,
        label: "매우 위험",
      };
    case "HIGH":
      return {
        bar: Colors.semantic.warning,
        pillBg: Colors.semantic.warningBg,
        pillText: Colors.semantic.warning,
        label: "위험",
      };
    case "MEDIUM":
      return {
        bar: "#7C3AED",
        pillBg: "#F3E8FF",
        pillText: "#6B21A8",
        label: "주의",
      };
    case "LOW":
    default:
      return {
        bar: Colors.semantic.info,
        pillBg: Colors.semantic.infoBg,
        pillText: Colors.semantic.info,
        label: "참고",
      };
  }
}

export function GuardianMedicationWarningCard({ warning, onPressDrug }: Props) {
  const visual = severityVisual(warning.severity);
  const typeLabel = TYPE_LABEL[warning.type] ?? "주의";
  const indirect = isIndirectRisk(warning);

  return (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: visual.bar }]} />
      <View style={styles.content}>
        {/* Header — 배지 + 간접 위험 표시 */}
        <View style={styles.headerRow}>
          <View style={[styles.pill, { backgroundColor: visual.pillBg }]}>
            <AppText
              variant="caption"
              audience="guardian"
              style={[styles.pillText, { color: visual.pillText }]}
            >
              {visual.label}
            </AppText>
          </View>
          <View style={[styles.pill, { backgroundColor: Colors.gray[100] }]}>
            <AppText
              variant="caption"
              audience="guardian"
              color="secondary"
              style={styles.pillText}
            >
              {typeLabel}
            </AppText>
          </View>
          {indirect && (
            <View style={styles.indirectPill}>
              <Ionicons
                name="git-network-outline"
                size={12}
                color={Colors.text.secondary}
              />
              <AppText
                variant="caption"
                audience="guardian"
                color="secondary"
                style={styles.pillText}
              >
                간접
              </AppText>
            </View>
          )}
        </View>

        {/* 사용자 친화 설명 */}
        <AppText variant="body" audience="guardian" style={styles.explanation}>
          {warning.explanation}
        </AppText>

        {/* 관련 약 (탭 가능) */}
        {warning.involvedDrugNames?.length > 0 && (
          <View style={styles.section}>
            <AppText
              variant="caption"
              audience="guardian"
              color="secondary"
              style={styles.sectionLabel}
            >
              관련 약
            </AppText>
            <DrugNameChips
              names={warning.involvedDrugNames}
              audience="guardian"
              onPressDrug={onPressDrug}
            />
          </View>
        )}

        {/* 관련 성분 칩 */}
        {warning.involvedIngredients.length > 0 && (
          <View style={styles.section}>
            <AppText
              variant="caption"
              audience="guardian"
              color="secondary"
              style={styles.sectionLabel}
            >
              관련 성분
            </AppText>
            <View style={styles.chipRow}>
              {warning.involvedIngredients.map((ing) => (
                <View key={ing} style={styles.chip}>
                  <AppText variant="caption" audience="guardian">
                    {ing}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 원본 의학 메시지 */}
        <View style={styles.rawBlock}>
          <Ionicons
            name="document-text-outline"
            size={14}
            color={Colors.text.secondary}
          />
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            style={styles.rawText}
          >
            {warning.rawMessage}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Elevation.sm,
  },
  bar: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  pill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pillText: {
    fontWeight: "700",
  },
  indirectPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray[100],
  },
  explanation: {
    marginTop: Spacing.xxs,
  },
  section: {
    marginTop: Spacing.xs,
  },
  sectionLabel: {
    marginBottom: Spacing.xxs,
    fontWeight: "600",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.brand.primaryLight,
  },
  rawBlock: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.divider,
  },
  rawText: {
    flex: 1,
    lineHeight: 20,
  },
});
