import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import type {
  Warning,
  WarningSeverity,
  WarningType,
} from "../../types/drugSafety";
import { cleanExplanation, isIndirectRisk } from "../../utils/drugSafety";
interface Props {
  warning: Warning;
}

const TYPE_LABEL: Record<WarningType, string> = {
  CONTRAINDICATED: "함께 먹으면 위험한 조합",
  ELDERLY: "어르신 주의 약물",
  DUPLICATE: "비슷한 효능 약물 중복",
  PREGNANCY: "임신 중 금기 약물",
  OVERDOSE: "복용량 주의",
  DURATION: "복용 기간 주의",
};

interface SeverityVisual {
  barColor: string;
  pillBg: string;
  pillText: string;
  label: string;
}

function severityVisual(severity: WarningSeverity): SeverityVisual {
  switch (severity) {
    case "CRITICAL":
      return {
        barColor: Colors.semantic.danger,
        pillBg: Colors.semantic.dangerBg,
        pillText: Colors.semantic.danger,
        label: "매우 주의",
      };
    case "HIGH":
      return {
        barColor: Colors.semantic.warning,
        pillBg: Colors.semantic.warningBg,
        pillText: Colors.semantic.warning,
        label: "주의",
      };
    case "MEDIUM":
      return {
        barColor: "#7C3AED",
        pillBg: "#F3E8FF",
        pillText: "#6B21A8",
        label: "확인 필요",
      };
    case "LOW":
    default:
      return {
        barColor: Colors.semantic.info,
        pillBg: Colors.semantic.infoBg,
        pillText: Colors.semantic.info,
        label: "참고",
      };
  }
}

/**
 * 피보호자용 경고 카드 (시니어 UI).
 * <p>
 * - explanation 중심 (Graph RAG가 약 이름 기반 친절 설명 + 상담 권유 포함하여 반환).
 * - 좌측 severity 색상 바.
 * - 간접 위험 배지 (rawMessage 가 "[간접 위험]" 으로 시작) 추가 표시.
 */
export function MedicationWarningCard({ warning }: Props) {
  const visual = severityVisual(warning.severity);
  const typeLabel = TYPE_LABEL[warning.type] ?? "주의 사항";
  const indirect = isIndirectRisk(warning);

  return (
    <View style={styles.card}>
      <View style={[styles.bar, { backgroundColor: visual.barColor }]} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={[styles.pill, { backgroundColor: visual.pillBg }]}>
            <AppText
              variant="caption"
              audience="elderly"
              style={[styles.pillText, { color: visual.pillText }]}
            >
              {visual.label}
            </AppText>
          </View>
          {indirect && (
            <View style={[styles.pill, { backgroundColor: Colors.gray[100] }]}>
              <AppText
                variant="caption"
                audience="elderly"
                color="secondary"
                style={styles.pillText}
              >
                간접 위험
              </AppText>
            </View>
          )}
        </View>

        <AppText
          variant="h3"
          audience="elderly"
          style={styles.title}
          numberOfLines={2}
        >
          {typeLabel}
        </AppText>

        <AppText
          variant="body"
          audience="elderly"
          color="secondary"
          style={styles.explanation}
        >
          {cleanExplanation(warning.explanation)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    overflow: "hidden",
    ...Elevation.sm,
  },
  bar: {
    width: 8,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
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
  title: {
    marginTop: Spacing.xxs,
  },
  explanation: {
    marginTop: Spacing.xxs,
  },
});
