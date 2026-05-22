// 피보호자 홈 진입 카드 — 처방전 안전 분석.
//
// 상태별 표시:
//  - 로딩: 회색 skeleton-like
//  - 분석 이력 없음 (D001): "복용 중인 약이 안전한지 확인해 보세요"
//  - 안전 (warnings 0): 초록 배경
//  - 주의 N건 (warnings > 0): 주황 배경
//  - 30일 이상 경과 (OUTDATED): 시간 텍스트 빨강 + "업데이트 권장"

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../common/Card";
import { AppText } from "../common/Text";
import { Colors, Radius, Spacing } from "../../theme";
import { useSelfMedicationAnalysis } from "../../hooks/useDrugSafety";
import { formatAnalyzedAt, getAnalysisFreshness } from "../../utils/drugSafety";
import { ApiException } from "../../services/api";

interface Props {
  onPress: () => void;
}

export function HomeMedicationAnalysisCard({ onPress }: Props) {
  const { data, isLoading, isError, error } = useSelfMedicationAnalysis();

  const noAnalysis =
    isError && error instanceof ApiException && error.code === "D001";

  // ─── 로딩 ───
  if (isLoading) {
    return (
      <Card variant="elevated">
        <View style={styles.row}>
          <View
            style={[styles.iconWrap, { backgroundColor: Colors.gray[200] }]}
          >
            <Ionicons
              name="shield-checkmark"
              size={28}
              color={Colors.gray[500]}
            />
          </View>
          <View style={styles.textWrap}>
            <AppText variant="bodyBold" audience="elderly">
              처방전 안전 분석
            </AppText>
            <AppText
              variant="caption"
              audience="elderly"
              color="secondary"
              style={styles.caption}
            >
              불러오는 중…
            </AppText>
          </View>
        </View>
      </Card>
    );
  }

  // ─── 분석 이력 없음 ───
  if (noAnalysis) {
    return (
      <Card
        variant="elevated"
        onPress={onPress}
        accessibilityLabel="처방전 안전 분석 시작"
      >
        <View style={styles.row}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: Colors.brand.primaryLight },
            ]}
          >
            <Ionicons
              name="shield-checkmark"
              size={28}
              color={Colors.brand.primary}
            />
          </View>
          <View style={styles.textWrap}>
            <AppText variant="bodyBold" audience="elderly">
              처방전 안전 분석
            </AppText>
            <AppText
              variant="body"
              audience="elderly"
              color="secondary"
              style={styles.caption}
            >
              복용 중인 약이 안전한지 확인해 보세요
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.gray[500]} />
        </View>
      </Card>
    );
  }

  // ─── 기타 에러 ───
  if (isError || !data) {
    return (
      <Card variant="outlined" onPress={onPress}>
        <View style={styles.row}>
          <Ionicons
            name="alert-circle-outline"
            size={24}
            color={Colors.semantic.warning}
          />
          <AppText
            variant="body"
            audience="elderly"
            color="secondary"
            style={styles.errorText}
          >
            분석을 불러오지 못했어요
          </AppText>
        </View>
      </Card>
    );
  }

  // ─── 정상 결과 ───
  const warningCount = data.warnings.length;
  const isClean = warningCount === 0;
  const freshness = getAnalysisFreshness(data.analyzedAt);
  const outdated = freshness === "OUTDATED";

  const visual = isClean
    ? {
        bg: Colors.semantic.successBg,
        iconBg: Colors.semantic.success,
        icon: "shield-checkmark" as const,
        title: "안전해요",
        subtitle: formatAnalyzedAt(data.analyzedAt),
      }
    : {
        bg: Colors.semantic.warningBg,
        iconBg: Colors.semantic.warning,
        icon: "warning" as const,
        title: `주의 ${warningCount}건`,
        subtitle: outdated
          ? `${formatAnalyzedAt(data.analyzedAt)} · 업데이트 권장`
          : formatAnalyzedAt(data.analyzedAt),
      };

  return (
    <Card
      variant="elevated"
      style={{ backgroundColor: visual.bg }}
      onPress={onPress}
      accessibilityLabel={`처방전 안전 분석 ${visual.title}`}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: visual.iconBg }]}>
          <Ionicons name={visual.icon} size={28} color={Colors.text.inverse} />
        </View>
        <View style={styles.textWrap}>
          <AppText variant="bodyBold" audience="elderly">
            처방전 안전 분석
          </AppText>
          <AppText variant="h3" audience="elderly" style={styles.value}>
            {visual.title}
          </AppText>
          <AppText
            variant="caption"
            audience="elderly"
            color={outdated ? "danger" : "secondary"}
            style={styles.caption}
          >
            {visual.subtitle}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={24} color={Colors.gray[500]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  value: {
    marginTop: 2,
  },
  caption: {
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
});
