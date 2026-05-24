import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { BottomActionBar } from "../../components/common/BottomActionBar";
import { PrimaryButton, SecondaryButton } from "../../components/common/Button";
import { MedicationAutoRegisterCard } from "../../components/elderly/MedicationAutoRegisterCard";
import { HeroStatusCard } from "../../components/elderly/HeroStatusCard";
import { AnalysisDisclaimerNote } from "../../components/elderly/AnalysisDisclaimerNote";
import { AnalysisEmptyView } from "../../components/elderly/AnalysisEmptyView";
import { PrescriptionEntryCard } from "../../components/elderly/PrescriptionEntryCard";
import { WarningCardCritical } from "../../components/elderly/WarningCardCritical";
import { WarningCardSimple } from "../../components/elderly/WarningCardSimple";

import { Colors, Spacing } from "../../theme";
import { useSelfMedicationAnalysis } from "../../hooks/useDrugSafety";
import { sortWarningsBySeverity } from "../../utils/drugSafety";
import { ApiException } from "../../services/api";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<
  RootStackParamList,
  "MedicationAnalysisResult"
>;

export default function MedicationAnalysisResultScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useSelfMedicationAnalysis();

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

  const goPrescriptionList = () => {
    navigation.navigate("PrescriptionList");
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

  // ─── 빈 상태: D001(분석 이력 없음) 또는 정상 응답인데 처방 0건 ───
  const isEmpty =
    (isError && error instanceof ApiException && error.code === "D001") ||
    (data != null && data.prescriptions.length === 0);

  if (isEmpty) {
    return (
      <View style={styles.root}>
        <AppHeader title="분석 결과" audience="elderly" onBackPress={goHome} />
        <AnalysisEmptyView variant="no-prescription" />
        <BottomActionBar audience="elderly">
          <PrimaryButton
            label="처방 분석 시작하기"
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
        <AnalysisEmptyView variant="error" />
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

  // ─── 정상 응답 (warnings 있음/없음 모두 여기서 처리) ───
  const sortedWarnings = sortWarningsBySeverity(data.warnings);
  const criticalWarnings = sortedWarnings.filter(
    (w) => w.severity === "CRITICAL" || w.severity === "HIGH",
  );
  const simpleWarnings = sortedWarnings.filter(
    (w) => w.severity === "MEDIUM" || w.severity === "LOW",
  );

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
        <HeroStatusCard
          warnings={data.warnings}
          prescriptions={data.prescriptions}
          analyzedAt={data.analyzedAt}
        />
        {data.autoRegisterResult && (
          <MedicationAutoRegisterCard result={data.autoRegisterResult} />
        )}
        <AnalysisDisclaimerNote />
        <View style={styles.cardList}>
          {criticalWarnings.map((w, i) => (
            <WarningCardCritical
              key={`c-${i}`}
              warning={w}
              prescriptions={data.prescriptions}
            />
          ))}
          {simpleWarnings.map((w, i) => (
            <WarningCardSimple key={`s-${i}`} warning={w} />
          ))}
          <PrescriptionEntryCard
            count={data.prescriptions.length}
            onPress={goPrescriptionList}
          />
        </View>
      </ScreenContainer>
      <BottomActionBar audience="elderly">
        <View style={styles.buttonStack}>
          <PrimaryButton label="확인" audience="elderly" onPress={goHome} />
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
  cardList: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  buttonStack: {
    gap: Spacing.sm,
  },
});
