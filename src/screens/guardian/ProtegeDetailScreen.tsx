// src/screens/guardian/ProtegeDetailScreen.tsx

// 보호자 — 피보호자 상세 대시보드.
// 4A: HeroCard + LocationCard.
// 4B: TodaySummaryRow 추가, 기존 복약 PreviewCard 제거.
// [이상탐지] InactivityAnalysisBanner 추가 + TodaySummaryRow 의 "이상 감지" 카드 연결.
// [이상감지 로그] 오늘의 요약 "이상 감지" 카드 탭 → AnomalyLog 화면.

import React, { useCallback, useState } from "react";
import { Alert, StatusBar, StyleSheet, View } from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getMedicationTodayStatus } from "../../utils/medicationStatus";
import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { DangerButton } from "../../components/common/Button";
import { useToast } from "../../components/common/Toast";

import { ProtegeHeroCard } from "../../components/guardian/ProtegeHeroCard";
import { ProtegeLocationCard } from "../../components/guardian/ProtegeLocationCard";
import { TodaySummaryRow } from "../../components/guardian/TodaySummaryRow";
import { ProtegeMedicationAnalysisBanner } from "../../components/guardian/ProtegeMedicationAnalysisBanner";
import { InactivityAnalysisBanner } from "../../components/guardian/InactivityAnalysisBanner";
import { useMyWards, useUnlinkWard } from "../../hooks/useMyWards";
import { useSafetyZones } from "../../hooks/useSafetyZones";
import {
  useMedicationLogsByDate,
  useMedicationSchedules,
} from "../../hooks/useMedications";
import { useWardAnalysisState } from "../../hooks/useWardAnalysisState";
import {
  buildMedicationDailySummary,
  todayDateString,
} from "../../utils/medicationSummary";

import { Colors, Spacing } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";
import type { InactivityStatusCode } from "../../types/analysisState";

type Route = RouteProp<RootStackParamList, "ProtegeDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList, "ProtegeDetail">;

/**
 * 미활동 분석 상태 → "오늘의 요약" 이상 감지 카드의 건수.
 *  - 분석 전(null) / 위치 확인 불가(UNKNOWN) → null (카드 "준비 중" 유지)
 *  - INACTIVE → 1건, ACTIVE → 0건
 * ※ analysis-state 는 건수가 아닌 상태코드를 주므로 현재 이상 1건으로 환산.
 */
function toAnomalyCount(
  statusCode: InactivityStatusCode | undefined,
): number | null {
  if (statusCode === 1) return 1;
  if (statusCode === 0) return 0;
  return null;
}

export default function ProtegeDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const toast = useToast();

  const protegeId = route.params.protegeId;
  const today = todayDateString();

  const { data: wards = [], refetch: refetchWards } = useMyWards();
  const protege = wards.find((w) => w.id === protegeId);

  const { refetch: refetchZones } = useSafetyZones(protegeId);

  const { data: schedules = [], refetch: refetchSchedules } =
    useMedicationSchedules(protegeId);

  const { data: todayLogs = [], refetch: refetchLogs } =
    useMedicationLogsByDate(protegeId, today);

  // 미활동 분석 상태 — 배너가 내부에서 같은 훅을 또 부르지만 react-query 가 같은
  // queryKey 로 dedup 하므로 네트워크 요청은 1회. 여기선 요약 카드 + 새로고침용.
  const { data: analysisState, refetch: refetchAnalysis } =
    useWardAnalysisState(protegeId);

  const medSummary = buildMedicationDailySummary(schedules, todayLogs);
  const medMissedCount = schedules.filter(
    (s) => getMedicationTodayStatus(s, todayLogs)?.kind === "MISSED",
  ).length;
  const anomalyCount = toAnomalyCount(analysisState?.inactivity?.statusCode);

  const unlinkMutation = useUnlinkWard();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchWards(),
        refetchZones(),
        refetchSchedules(),
        refetchLogs(),
        refetchAnalysis(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    refetchWards,
    refetchZones,
    refetchSchedules,
    refetchLogs,
    refetchAnalysis,
  ]);

  useFocusEffect(
    useCallback(() => {
      refetchWards();
    }, [refetchWards]),
  );

  const handleSafetyZone = () => {
    navigation.navigate("SafetyZoneList", { protegeId });
  };

  const handleMedication = () => {
    navigation.navigate("GuardianMedicationOverview", { protegeId });
  };

  const handleMedicationAnalysis = () => {
    navigation.navigate("MedicationAnalysisDetail", { protegeId });
  };

  // "이상 감지" 카드 탭 → 이상감지 기록 화면.
  const handleAnomalyLog = () => {
    navigation.navigate("AnomalyLog", { protegeId });
  };

  const displayName = protege?.name ?? "피보호자";

  const handleUnlink = () => {
    Alert.alert(
      "연결 해제",
      `${displayName}님과의 연결을 해제할까요?\n해제하면 위치·복약 등 모니터링이 모두 중단돼요.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "연결 해제",
          style: "destructive",
          onPress: () => {
            unlinkMutation.mutate(protegeId, {
              onSuccess: () => {
                toast.show({
                  message: `${displayName}님과의 연결을 해제했어요`,
                  variant: "info",
                });
                navigation.goBack();
              },
              onError: (err: any) => {
                toast.show({
                  message: err?.message ?? "연결 해제에 실패했어요",
                  variant: "error",
                });
              },
            });
          },
        },
      ],
    );
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <AppHeader title={displayName} audience="guardian" />
      <ScreenContainer
        audience="guardian"
        scrollable
        paddingTop={Spacing.md}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {protege && <ProtegeHeroCard protege={protege} />}

        <ProtegeLocationCard
          status={protege?.status ?? "unknown"}
          locationLabel={protege?.locationLabel ?? "위치 정보 없음"}
          lastReportedMinutesAgo={protege?.lastReportedMinutesAgo ?? null}
          onPress={handleSafetyZone}
        />

        <TodaySummaryRow
          medTakenCount={medSummary.takenCount}
          medTotalCount={medSummary.totalCount}
          medMissedCount={medMissedCount}
          anomalyCount={anomalyCount}
          onMedPress={handleMedication}
          onAnomalyPress={handleAnomalyLog}
        />

        <ProtegeMedicationAnalysisBanner
          protegeId={protegeId}
          protegeName={displayName}
          onPress={handleMedicationAnalysis}
        />
        <InactivityAnalysisBanner
          protegeId={protegeId}
          protegeName={displayName}
        />

        <View style={styles.unlinkSection}>
          <DangerButton
            label="연결 해제"
            audience="guardian"
            onPress={handleUnlink}
            loading={unlinkMutation.isPending}
          />
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  unlinkSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});
