// src/screens/elderly/MedicationTodayScreen.tsx

// 피보호자 — 오늘의 약 화면.
// 메인 로직 + 화면 전용 작은 컴포넌트(관리 버튼, 빈/에러 상태).
// 카드는 components/elderly에서 import.

import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { useToast } from "../../components/common/Toast";
import { MedicationProgressCard } from "../../components/elderly/MedicationProgressCard";
import { MedicationItemCard } from "../../components/elderly/MedicationItemCard";
import { MedicationManageButton } from "../../components/medication/MedicationManageButton";
import { MedicationTodayError } from "../../components/medication/MedicationTodayError";
import { MedicationTodayEmpty } from "../../components/medication/MedicationTodayEmpty";
import { useAuthStore } from "../../stores/authStore";
import {
  useMedicationLogsByDate,
  useMedicationSchedules,
  useTakeMedication,
} from "../../hooks/useMedications";
import {
  nowLocalDateTimeIso,
  todayDateString,
} from "../../utils/medicationSummary";
import { Colors, Radius, Spacing, Touch } from "../../theme";
import { haptic } from "../../utils/haptics";
import type { DayOfWeek, MedicationSchedule } from "../../types/medication";
import type { RootStackParamList } from "../../types/navigation";

const DOW_ORDER: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

type Nav = NativeStackNavigationProp<RootStackParamList, "MedicationToday">;

interface TodayItem {
  schedule: MedicationSchedule;
  isTaken: boolean;
}

export default function MedicationTodayScreen() {
  const navigation = useNavigation<Nav>();
  const toast = useToast();

  const protegeId = useAuthStore((s) => s.user?.id) ?? 0;
  const enabled = protegeId > 0;

  // 1분마다 갱신 — "다음 복용" 자동 이동용.
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      const id = setInterval(() => setNow(new Date()), 60_000);
      return () => clearInterval(id);
    }, []),
  );

  const today = todayDateString(now);

  const {
    data: schedules = [],
    isLoading: schedulesLoading,
    isError: schedulesError,
    refetch: refetchSchedules,
  } = useMedicationSchedules(protegeId, { enabled });

  const {
    data: logs = [],
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useMedicationLogsByDate(protegeId, today, { enabled });

  const takeMutation = useTakeMedication();

  // 오늘 일정 + 복용 상태 + 다음 복용 ID 계산
  const { todayItems, totalCount, takenCount, nextScheduleId, allDone } =
    useMemo(() => {
      const todayDow = DOW_ORDER[now.getDay()];

      const filtered = schedules
        .filter(
          (s) =>
            s.active &&
            (s.scheduleType === "DAILY" || s.daysOfWeek.includes(todayDow)),
        )
        .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

      const takenIds = new Set(
        logs.map((l) => l.scheduleId).filter((id): id is number => id !== null),
      );

      const items: TodayItem[] = filtered.map((s) => ({
        schedule: s,
        isTaken: takenIds.has(s.id),
      }));
      const total = items.length;
      const taken = items.filter((i) => i.isTaken).length;
      const done = total > 0 && taken === total;

      // 다음 복용: 미복용 중 현재 시각 이후 가장 가까운 일정. 없으면 가장 이른 미복용.
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const remaining = items
        .filter((i) => !i.isTaken)
        .map((i) => {
          const [h, m] = i.schedule.scheduledTime.split(":").map(Number);
          return { item: i, minutes: h * 60 + m };
        })
        .sort((a, b) => a.minutes - b.minutes);
      const next =
        remaining.find((x) => x.minutes >= nowMinutes) ?? remaining[0];

      return {
        todayItems: items,
        totalCount: total,
        takenCount: taken,
        nextScheduleId: next?.item.schedule.id ?? null,
        allDone: done,
      };
    }, [schedules, logs, now]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchSchedules(), refetchLogs()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchSchedules, refetchLogs]);

  const handleTake = (item: TodayItem) => {
    if (item.isTaken) {
      toast.show({
        message: "이미 복용으로 표시된 약이에요",
        variant: "info",
        durationMs: 1500,
      });
      return;
    }
    haptic.success();
    takeMutation.mutate(
      {
        protegeId,
        scheduleId: item.schedule.id,
        takenAt: nowLocalDateTimeIso(),
        medicationName: item.schedule.medicationName,
        logSource: "USER_INPUT",
      },
      {
        onError: () => {
          haptic.error();
          toast.show({
            message: "복용 표시에 실패했어요. 잠시 후 다시 시도해주세요",
            variant: "error",
          });
        },
      },
    );
  };

  const handleManage = () => {
    navigation.navigate("MedicationList", { protegeId });
  };

  const handleAddDirect = () => {
    navigation.navigate("MedicationEdit", { protegeId });
  };

  const isInitialLoading =
    enabled &&
    (schedulesLoading || logsLoading) &&
    schedules.length === 0 &&
    logs.length === 0;

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <AppHeader
        title="오늘의 약"
        audience="elderly"
        rightElement={<MedicationManageButton onPress={handleManage} />}
      />

      <ScreenContainer
        audience="elderly"
        scrollable
        paddingTop={Spacing.md}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {isInitialLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
          </View>
        ) : schedulesError ? (
          <MedicationTodayError onRetry={onRefresh} />
        ) : totalCount === 0 ? (
          <MedicationTodayEmpty onAddPress={handleAddDirect} />
        ) : (
          <>
            <MedicationProgressCard
              totalCount={totalCount}
              takenCount={takenCount}
              allDone={allDone}
            />
            <View style={styles.list}>
              {todayItems.map((item) => (
                <MedicationItemCard
                  key={item.schedule.id}
                  schedule={item.schedule}
                  isTaken={item.isTaken}
                  isNext={item.schedule.id === nextScheduleId}
                  onPress={() => handleTake(item)}
                />
              ))}
            </View>
          </>
        )}
      </ScreenContainer>
    </>
  );
}

// ────────────────────────────────────────────
// 화면 전용 작은 컴포넌트 (ProtegeDetailScreen의 PreviewCard 패턴)
// ────────────────────────────────────────────

const styles = StyleSheet.create({
  centerBox: {
    flex: 1,
    minHeight: 400,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
});
