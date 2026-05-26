// src/screens/shared/MedicationListScreen.tsx

// 복약 일정 전체 목록 — 양쪽 공유 화면.
// audience 자동 추론 (role === "elderly" ? elderly : guardian).
// 카드 탭 → MedicationEdit (E 만들기 전 임시 toast).
// FAB → 새 약 추가 (E 만들기 전 임시 toast).

import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { useToast } from "../../components/common/Toast";
import { MedicationScheduleCard } from "../../components/medication/MedicationScheduleCard";
import { MedicationScheduleListEmpty } from "../../components/medication/MedicationScheduleListEmpty";
import { MedicationScheduleListError } from "../../components/medication/MedicationScheduleListError";
import { AddMedicationFab } from "../../components/medication/AddMedicationFab";
import {
  useMedicationLogsByDate,
  useMedicationSchedules,
} from "../../hooks/useMedications";
import { getMedicationTodayStatus } from "../../utils/medicationStatus";
import { todayDateString } from "../../utils/medicationSummary";
import { useAuthStore } from "../../stores/authStore";
import { useMyWards } from "../../hooks/useMyWards";
import { groupSchedules } from "../../utils/medicationGroup";
import { MedicationGroupCard } from "../../components/medication/MedicationGroupCard";
import { Colors, Spacing } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";

type Route = RouteProp<RootStackParamList, "MedicationList">;
type Nav = NativeStackNavigationProp<RootStackParamList, "MedicationList">;

export default function MedicationListScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const toast = useToast();

  const protegeId = route.params.protegeId;
  const role = useAuthStore((s) => s.user?.role);
  const audience: "elderly" | "guardian" =
    role === "elderly" ? "elderly" : "guardian";

  const { data: wards = [] } = useMyWards({
    enabled: audience === "guardian",
  });

  const wardName =
    audience === "guardian"
      ? wards.find((w) => w.id === protegeId)?.name
      : undefined;

  const {
    data: schedules = [],
    isLoading,
    isError,
    refetch,
  } = useMedicationSchedules(protegeId, { enabled: protegeId > 0 });
  const today = todayDateString();
  const { data: todayLogs = [] } = useMedicationLogsByDate(protegeId, today, {
    enabled: protegeId > 0,
  });

  const sortedSchedules = useMemo(
    () =>
      [...schedules]
        .filter((s) => s.active)
        .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
    [schedules],
  );

  const activeSchedules = useMemo(
    () => schedules.filter((s) => s.active),
    [schedules],
  );
  const groups = useMemo(
    () => groupSchedules(activeSchedules),
    [activeSchedules],
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleCardPress = (scheduleId: number) => {
    navigation.navigate("MedicationEdit", { protegeId, scheduleId });
  };

  const handleAddPress = () => {
    navigation.navigate("MedicationEdit", { protegeId });
  };

  const isInitialLoading = isLoading && schedules.length === 0;
  const hasData = groups.length > 0;
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <AppHeader title="복약 일정" audience={audience} />

      <View style={styles.root}>
        <ScreenContainer
          audience={audience}
          scrollable
          paddingTop={Spacing.md}
          refreshing={refreshing}
          onRefresh={onRefresh}
        >
          {isInitialLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={Colors.brand.primary} />
            </View>
          ) : isError ? (
            <MedicationScheduleListError
              audience={audience}
              onRetry={onRefresh}
            />
          ) : !hasData ? (
            <MedicationScheduleListEmpty
              audience={audience}
              wardName={wardName}
              onAddPress={handleAddPress}
            />
          ) : (
            <View style={styles.list}>
              {groups.map((g) => {
                const takenToday = g.schedules.filter(
                  (s) =>
                    getMedicationTodayStatus(s, todayLogs)?.kind === "TAKEN",
                ).length;
                const missedToday = g.schedules.filter(
                  (s) =>
                    getMedicationTodayStatus(s, todayLogs)?.kind === "MISSED",
                ).length;
                return (
                  <MedicationGroupCard
                    key={g.key}
                    group={g}
                    audience={audience}
                    takenToday={takenToday}
                    missedToday={missedToday}
                    total={g.times.length}
                    onPress={() =>
                      navigation.navigate("MedicationEdit", {
                        protegeId,
                        scheduleId: g.schedules[0].id, // 파트2에서 이 약 전체를 불러옴
                      })
                    }
                  />
                );
              })}
            </View>
          )}
        </ScreenContainer>
        {hasData && (
          <AddMedicationFab audience={audience} onPress={handleAddPress} />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    minHeight: 400,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    gap: Spacing.md,
    paddingBottom: 120, // FAB 영역 확보
  },
});
