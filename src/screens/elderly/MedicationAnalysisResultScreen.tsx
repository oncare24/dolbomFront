import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { BottomActionBar } from "../../components/common/BottomActionBar";
import { MedicationWarningCard } from "../../components/elderly/MedicationWarningCard";
import { Colors, Radius, Spacing } from "../../theme";
import { useSelfMedicationAnalysis } from "../../hooks/useDrugSafety";
import {
  formatAnalyzedAt,
  getAnalysisFreshness,
  sortWarningsBySeverity,
} from "../../utils/drugSafety";
import { ApiException } from "../../services/api";
import type { RootStackParamList } from "../../types/navigation";
import { PrimaryButton, SecondaryButton } from "../../components/common/Button";
import { PrescriptionCardElderly } from "../../components/elderly/PrescriptionCardElderly";
import { groupPrescriptions } from "../../utils/prescription";
import { HealthAdviceCard } from "../../components/elderly/HealthAdviceCard";

type Nav = NativeStackNavigationProp<
  RootStackParamList,
  "MedicationAnalysisResult"
>;

export default function MedicationAnalysisResultScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useSelfMedicationAnalysis();

  const noAnalysis =
    isError && error instanceof ApiException && error.code === "D001";

  const goHome = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: "ElderlyHome" }],
      });
    }
  };

  const goStartFlow = () => {
    navigation.reset({
      index: 1,
      routes: [{ name: "ElderlyHome" }, { name: "MedicationAnalysisIntro" }],
    });
  };

  // ─── 로딩 ───
  if (isLoading) {
    return (
      <View style={styles.root}>
        <AppHeader title="분석 결과" audience="elderly" onBackPress={goHome} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
          <AppText
            variant="body"
            audience="elderly"
            color="secondary"
            style={styles.loadingText}
          >
            분석 결과를 불러오는 중이에요
          </AppText>
        </View>
      </View>
    );
  }

  // ─── 분석 이력 없음 (D001) ───
  if (noAnalysis) {
    return (
      <View style={styles.root}>
        <AppHeader title="분석 결과" audience="elderly" onBackPress={goHome} />
        <View style={styles.emptyWrap}>
          <Ionicons
            name="document-text-outline"
            size={96}
            color={Colors.gray[400]}
          />
          <AppText variant="h2" audience="elderly" style={styles.emptyTitle}>
            분석 결과가 없어요
          </AppText>
          <AppText
            variant="body"
            audience="elderly"
            color="secondary"
            style={styles.emptyBody}
          >
            처방전 분석을 먼저 진행해 주세요.
          </AppText>
        </View>
        <BottomActionBar audience="elderly">
          <PrimaryButton
            label="분석 시작하기"
            audience="elderly"
            onPress={goStartFlow}
          />
        </BottomActionBar>
      </View>
    );
  }

  // ─── 기타 에러 ───
  if (isError || !data) {
    return (
      <View style={styles.root}>
        <AppHeader title="분석 결과" audience="elderly" onBackPress={goHome} />
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.semantic.warning}
          />
          <AppText variant="h3" audience="elderly" style={styles.errorTitle}>
            결과를 불러오지 못했어요
          </AppText>
        </View>
        <BottomActionBar audience="elderly">
          <PrimaryButton
            label="다시 시도"
            audience="elderly"
            loading={isRefetching}
            onPress={() => refetch()}
          />
        </BottomActionBar>
      </View>
    );
  }

  // ─── 정상 결과 ───
  const sortedWarnings = sortWarningsBySeverity(data.warnings);

  const prescriptionGroups = groupPrescriptions(data.prescriptions ?? []);
  const isClean = sortedWarnings.length === 0;
  const freshness = getAnalysisFreshness(data.analyzedAt);
  const isOutdated = freshness === "OUTDATED";

  return (
    <View style={styles.root}>
      <AppHeader title="분석 결과" audience="elderly" onBackPress={goHome} />

      <ScreenContainer
        audience="elderly"
        scrollable
        paddingTop={Spacing.md}
        refreshing={isRefetching}
        onRefresh={refetch}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons
              name={isClean ? "shield-checkmark" : "warning"}
              size={48}
              color={
                isClean ? Colors.semantic.success : Colors.semantic.warning
              }
            />
            <View style={styles.summaryHeaderText}>
              <AppText variant="h2" audience="elderly">
                {isClean
                  ? "안전해요"
                  : `주의가 필요한 약 ${sortedWarnings.length}개`}
              </AppText>
              <AppText
                variant="caption"
                audience="elderly"
                color={isOutdated ? "danger" : "secondary"}
                style={styles.analyzedAt}
              >
                {formatAnalyzedAt(data.analyzedAt)}
                {isOutdated && " · 업데이트 권장"}
              </AppText>
            </View>
          </View>

          <AppText
            variant="body"
            audience="elderly"
            color="secondary"
            style={styles.summaryBody}
          >
            {isClean
              ? "현재 처방받은 약물에서 주의해야 할 조합이 발견되지 않았습니다."
              : "아래 내용을 확인하고 의사나 약사와 상담해 보세요."}
          </AppText>
          {(data.prescriptions?.length ?? 0) > 0 && (
            <AppText
              variant="caption"
              audience="elderly"
              color="secondary"
              style={styles.summarySub}
            >
              처방받은 약 {data.prescriptions.length}개를 분석했어요
            </AppText>
          )}
        </View>

        <View style={styles.warningList}>
          {sortedWarnings.map((w, i) => (
            <MedicationWarningCard key={i} warning={w} />
          ))}
        </View>

        {prescriptionGroups.length > 0 && (
          <View style={styles.prescriptionsSection}>
            <View style={styles.sectionHeader}>
              <AppText variant="h3" audience="elderly">
                처방받은 약
              </AppText>
              <AppText variant="body" audience="elderly" color="secondary">
                총 {prescriptionGroups.length}종
              </AppText>
            </View>
            <View style={styles.prescriptionList}>
              {prescriptionGroups.map((g, i) => (
                <PrescriptionCardElderly key={i} group={g} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.adviceWrap}>
          <HealthAdviceCard />
        </View>
      </ScreenContainer>

      <BottomActionBar audience="elderly">
        <View style={styles.buttonStack}>
          <PrimaryButton label="홈으로" audience="elderly" onPress={goHome} />
          <SecondaryButton
            label="다시 분석하기"
            audience="elderly"
            onPress={goStartFlow}
          />
        </View>
      </BottomActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  emptyBody: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  errorTitle: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: Colors.surface.card,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  analyzedAt: {
    marginTop: 4,
  },
  summaryBody: {
    marginTop: Spacing.md,
  },
  warningList: {
    gap: Spacing.md,
  },
  buttonStack: {
    gap: Spacing.sm,
  },
  prescriptionsSection: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionCount: {
    marginLeft: Spacing.sm,
  },
  prescriptionList: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  summarySub: {
    marginTop: 4,
  },
  adviceWrap: {
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});
