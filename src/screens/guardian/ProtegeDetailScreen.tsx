// src/screens/guardian/ProtegeDetailScreen.tsx

// 보호자 — 피보호자 상세 대시보드.
// 4A: HeroCard + LocationCard.
// 4B: TodaySummaryRow 추가, 기존 복약 PreviewCard 제거.

import React, { useCallback, useState } from "react";
import { StatusBar } from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";

import { ProtegeHeroCard } from "../../components/guardian/ProtegeHeroCard";
import { ProtegeLocationCard } from "../../components/guardian/ProtegeLocationCard";
import { TodaySummaryRow } from "../../components/guardian/TodaySummaryRow";
import { ProtegeMedicationAnalysisBanner } from "../../components/guardian/ProtegeMedicationAnalysisBanner";
import { useMyWards } from "../../hooks/useMyWards";
import { useSafetyZones } from "../../hooks/useSafetyZones";
import {
  useMedicationLogsByDate,
  useMedicationSchedules,
} from "../../hooks/useMedications";
import {
  buildMedicationDailySummary,
  todayDateString,
} from "../../utils/medicationSummary";

import { Colors, Spacing } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";

type Route = RouteProp<RootStackParamList, "ProtegeDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList, "ProtegeDetail">;

export default function ProtegeDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const protegeId = route.params.protegeId;
  const today = todayDateString();

  const { data: wards = [], refetch: refetchWards } = useMyWards();
  const protege = wards.find((w) => w.id === protegeId);

  const { refetch: refetchZones } = useSafetyZones(protegeId);

  const { data: schedules = [], refetch: refetchSchedules } =
    useMedicationSchedules(protegeId);

  const { data: todayLogs = [], refetch: refetchLogs } =
    useMedicationLogsByDate(protegeId, today);

  const medSummary = buildMedicationDailySummary(schedules, todayLogs);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchWards(),
        refetchZones(),
        refetchSchedules(),
        refetchLogs(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchWards, refetchZones, refetchSchedules, refetchLogs]);

  const handleSafetyZone = () => {
    navigation.navigate("SafetyZoneList", { protegeId });
  };

  const handleMedication = () => {
    navigation.navigate("MedicationList", { protegeId });
  };

  const handleMedicationAnalysis = () => {
    navigation.navigate("MedicationAnalysisDetail", { protegeId });
  };

  const displayName = protege?.name ?? "피보호자";

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
          locationReportCount={null}
          anomalyCount={null}
          onMedPress={handleMedication}
        />

        <ProtegeMedicationAnalysisBanner
          protegeId={protegeId}
          protegeName={displayName}
          onPress={handleMedicationAnalysis}
        />
      </ScreenContainer>
    </>
  );
}
