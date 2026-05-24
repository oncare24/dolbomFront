// src/screens/guardian/ProtegeDetailScreen.tsx

// 보호자 — 피보호자 상세 대시보드.
// 4A: HeroCard + LocationCard.
// 4B: TodaySummaryRow 추가, 기존 복약 PreviewCard 제거.

import React, { useCallback, useState } from "react";
import { Alert, StatusBar, StyleSheet, View } from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { DangerButton } from "../../components/common/Button";
import { useToast } from "../../components/common/Toast";

import { ProtegeHeroCard } from "../../components/guardian/ProtegeHeroCard";
import { ProtegeLocationCard } from "../../components/guardian/ProtegeLocationCard";
import { TodaySummaryRow } from "../../components/guardian/TodaySummaryRow";
import { ProtegeMedicationAnalysisBanner } from "../../components/guardian/ProtegeMedicationAnalysisBanner";
import { useMyWards, useUnlinkWard } from "../../hooks/useMyWards";
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

  const medSummary = buildMedicationDailySummary(schedules, todayLogs);

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
          locationReportCount={null}
          anomalyCount={null}
          onMedPress={handleMedication}
        />

        <ProtegeMedicationAnalysisBanner
          protegeId={protegeId}
          protegeName={displayName}
          onPress={handleMedicationAnalysis}
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
