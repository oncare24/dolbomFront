// 복약 분석 결과 화면 상단 상태 카드.
// warnings 있음 → "꼭 확인하세요" + severity별 카운트.
// warnings 빈 → "주의 사항을 찾지 못했어요" + 분석한 약 종수.
// 책임 한계: 진단 아닌 의견 전달. 단정적 "안전해요" 표현 피함.

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import { formatAnalyzedAt } from "../../utils/drugSafety";
import { groupPrescriptions } from "../../utils/prescription";

import type {
  Prescription,
  Warning,
  WarningSeverity,
} from "../../types/drugSafety";

interface Props {
  warnings: Warning[];
  prescriptions: Prescription[];
  analyzedAt: string;
}

const SEVERITY_LABEL: Record<WarningSeverity, string> = {
  CRITICAL: "매우 주의",
  HIGH: "주의",
  MEDIUM: "확인 필요",
  LOW: "참고",
};

const SEVERITY_ORDER: WarningSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function summarizeWarnings(warnings: Warning[]): string {
  const counts = warnings.reduce<Partial<Record<WarningSeverity, number>>>(
    (acc, w) => {
      acc[w.severity] = (acc[w.severity] ?? 0) + 1;
      return acc;
    },
    {},
  );
  return SEVERITY_ORDER.filter((s) => (counts[s] ?? 0) > 0)
    .map((s) => `${SEVERITY_LABEL[s]} ${counts[s]}개`)
    .join(" · ");
}

export function HeroStatusCard({ warnings, prescriptions, analyzedAt }: Props) {
  const hasWarnings = warnings.length > 0;
  const analyzedLabel = formatAnalyzedAt(analyzedAt);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.iconWrap,
            hasWarnings ? styles.iconWrapDanger : styles.iconWrapSuccess,
          ]}
        >
          <Ionicons
            name={hasWarnings ? "warning" : "heart-outline"}
            size={30}
            color={
              hasWarnings ? Colors.semantic.danger : Colors.semantic.success
            }
          />
        </View>
        <View style={styles.text}>
          <AppText
            variant="h2"
            audience="elderly"
            color={hasWarnings ? "danger" : "primary"}
          >
            {hasWarnings ? "꼭 확인하세요" : "주의 사항을 찾지 못했어요"}
          </AppText>
          <AppText
            variant="caption"
            audience="elderly"
            color="secondary"
            style={styles.sub}
          >
            {hasWarnings
              ? summarizeWarnings(warnings)
              : `처방받은 약 ${
                  groupPrescriptions(prescriptions).length
                }종 분석함`}
          </AppText>
        </View>
      </View>

      <View style={styles.meta}>
        <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
        <AppText variant="caption" audience="elderly" color="secondary">
          {analyzedLabel}
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
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapDanger: {
    backgroundColor: Colors.semantic.dangerBg,
  },
  iconWrapSuccess: {
    backgroundColor: Colors.semantic.successBg,
  },
  text: {
    flex: 1,
  },
  sub: {
    marginTop: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.md,
  },
});
