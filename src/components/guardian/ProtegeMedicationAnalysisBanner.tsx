// 보호자 ProtegeDetail 화면 진입 배너.
// 분석 상태에 따라 5가지 표시 분기:
//  - 로딩 중
//  - 분석 이력 없음 (D001) → 분석 요청 안내
//  - 안전 (warnings 0건)
//  - 주의 N건 (warnings > 0)
//  - 30일 이상 경과 → "업데이트 권장" 보조 메시지

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../common/Card";
import { AppText } from "../common/Text";
import { Colors, Radius, Spacing } from "../../theme";
import { useWardMedicationAnalysis } from "../../hooks/useDrugSafety";
import { formatAnalyzedAt, getAnalysisFreshness } from "../../utils/drugSafety";
import { ApiException } from "../../services/api";

interface Props {
  protegeId: number;
  protegeName: string;
  onPress: () => void;
}

export function ProtegeMedicationAnalysisBanner({
  protegeId,
  protegeName,
  onPress,
}: Props) {
  const { data, isLoading, isError, error } =
    useWardMedicationAnalysis(protegeId);

  const noAnalysis =
    isError && error instanceof ApiException && error.code === "D001";

  // ─── 로딩 ───
  if (isLoading) {
    return (
      <Card variant="elevated" style={styles.card}>
        <View style={styles.row}>
          <View
            style={[styles.iconWrap, { backgroundColor: Colors.gray[200] }]}
          >
            <Ionicons name="medkit" size={22} color={Colors.gray[500]} />
          </View>
          <View style={styles.textWrap}>
            <AppText variant="bodyBold" audience="guardian">
              약물 안전 분석
            </AppText>
            <AppText
              variant="caption"
              audience="guardian"
              color="secondary"
              style={styles.subtitle}
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
        style={styles.card}
        onPress={onPress}
        accessibilityLabel="약물 안전 분석 안내"
      >
        <View style={styles.row}>
          <View
            style={[styles.iconWrap, { backgroundColor: Colors.gray[100] }]}
          >
            <Ionicons
              name="document-text-outline"
              size={22}
              color={Colors.gray[600]}
            />
          </View>
          <View style={styles.textWrap}>
            <AppText variant="bodyBold" audience="guardian">
              약물 안전 분석
            </AppText>
            <AppText
              variant="caption"
              audience="guardian"
              color="secondary"
              style={styles.subtitle}
            >
              아직 진행되지 않았어요. {protegeName}님께 분석을 요청해 보세요.
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
        </View>
      </Card>
    );
  }

  // ─── 기타 에러 ───
  if (isError || !data) {
    return (
      <Card variant="outlined" style={styles.card}>
        <View style={styles.row}>
          <Ionicons
            name="alert-circle-outline"
            size={22}
            color={Colors.semantic.warning}
          />
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            style={styles.errorText}
          >
            약물 안전 분석을 불러오지 못했어요
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
        title: "안전",
        subtitle: `${formatAnalyzedAt(data.analyzedAt)} · 주의 조합 없음`,
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
      style={[styles.card, { backgroundColor: visual.bg }]}
      onPress={onPress}
      accessibilityLabel={`약물 안전 분석 ${visual.title}`}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: visual.iconBg }]}>
          <Ionicons name={visual.icon} size={22} color={Colors.text.inverse} />
        </View>
        <View style={styles.textWrap}>
          <AppText variant="bodyBold" audience="guardian">
            약물 안전 분석 · {visual.title}
          </AppText>
          <AppText
            variant="caption"
            audience="guardian"
            color={outdated ? "danger" : "secondary"}
            style={styles.subtitle}
          >
            {visual.subtitle}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.gray[500]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  errorText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
});
