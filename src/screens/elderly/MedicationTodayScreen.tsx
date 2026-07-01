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
import { toKoreanTime } from "../../utils/medicationFormat";
import { timeSlotLabel } from "../../utils/mealLabel";
import { haptic } from "../../utils/haptics";
import type { DayOfWeek, MedicationSchedule } from "../../types/medication";
import type { RootStackParamList } from "../../types/navigation";
import { MedicationSlotCard } from "../../components/elderly/MedicationSlotCard";
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

interface TodaySlot {
  time: string;
  schedules: MedicationSchedule[];
  isTaken: boolean;
  isNext: boolean;
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

  const { slots, totalSlots, takenSlots, allDone } = useMemo(() => {
    const todayDow = DOW_ORDER[now.getDay()];

    const takenIds = new Set(
      logs.map((l) => l.scheduleId).filter((id): id is number => id !== null),
    );

    const filtered = schedules.filter((s) => {
      if (!s.active) return false;
      if (s.scheduleType === "WEEKLY" && !s.daysOfWeek.includes(todayDow))
        return false;
      if (s.startDate && today < s.startDate) return false;
      if (s.endDate && today > s.endDate) return false;
      // 등록 시각 이후 회차만: 오늘 이 시각이 등록 시각보다 전이면 오늘은 제외(내일부터).
      // 단, 이미 먹은 회차는 항상 포함 — 먹었으면 오늘 회차가 맞으므로 숨기지 않는다.
      const [hh, mm] = s.scheduledTime.split(":").map(Number);
      const doseToday = new Date(now);
      doseToday.setHours(hh, mm, 0, 0);
      // if (
      //   s.createdAt &&
      //   doseToday.getTime() < new Date(s.createdAt).getTime() &&
      //   !takenIds.has(s.id)
      // )
      //   return false;

      if (
        s.createdAt &&
        doseToday.getTime() < new Date(s.createdAt).getTime() &&
        !takenIds.has(s.id)
      )
        return false;

      return true;
    });

    // 같은 시각끼리 묶기
    const byTime = new Map<string, MedicationSchedule[]>();
    for (const s of filtered) {
      const list = byTime.get(s.scheduledTime) ?? [];
      list.push(s);
      byTime.set(s.scheduledTime, list);
    }

    const grouped = Array.from(byTime.entries())
      .map(([time, scheds]) => ({
        time,
        schedules: scheds,
        isTaken: scheds.every((s) => takenIds.has(s.id)),
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    // 다음 회차: 미완료 중 현재 시각 이후 가장 가까운, 없으면 가장 이른 미완료
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const remaining = grouped
      .filter((g) => !g.isTaken)
      .map((g) => {
        const [h, m] = g.time.split(":").map(Number);
        return { time: g.time, minutes: h * 60 + m };
      })
      .sort((a, b) => a.minutes - b.minutes);
    const nextTime =
      (remaining.find((x) => x.minutes >= nowMinutes) ?? remaining[0])?.time ??
      null;

    const slotList: TodaySlot[] = grouped.map((g) => ({
      ...g,
      isNext: g.time === nextTime,
    }));
    const total = slotList.length;
    const taken = slotList.filter((g) => g.isTaken).length;

    return {
      slots: slotList,
      totalSlots: total,
      takenSlots: taken,
      allDone: total > 0 && taken === total,
    };
  }, [schedules, logs, now, today]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchSchedules(), refetchLogs()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchSchedules, refetchLogs]);

  const handleTakeSlot = (slot: TodaySlot) => {
    if (slot.isTaken) {
      toast.show({
        message: "이미 복용으로 표시된 시간이에요",
        variant: "info",
        durationMs: 1500,
      });
      return;
    }
    haptic.success();
    const takenIds = new Set(
      logs.map((l) => l.scheduleId).filter((id): id is number => id !== null),
    );
    const takenAt = nowLocalDateTimeIso();
    for (const s of slot.schedules) {
      if (takenIds.has(s.id)) continue; // 이미 기록된 약은 건너뜀
      takeMutation.mutate(
        {
          protegeId,
          scheduleId: s.id,
          takenAt,
          medicationName: s.medicationName,
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
    }
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
        ) : totalSlots === 0 ? (
          <MedicationTodayEmpty onAddPress={handleAddDirect} />
        ) : (
          <>
            <MedicationProgressCard
              totalCount={totalSlots}
              takenCount={takenSlots}
              allDone={allDone}
              nextLabel={(() => {
                const next = slots.find((s) => s.isNext && !s.isTaken);
                return next
                  ? `${timeSlotLabel(next.time)} ${toKoreanTime(next.time)}`
                  : null;
              })()}
            />
            <View style={styles.list}>
              {slots.map((slot) => (
                <MedicationSlotCard
                  key={slot.time}
                  time={slot.time}
                  medicationNames={slot.schedules.map((s) => s.medicationName)}
                  isTaken={slot.isTaken}
                  isNext={slot.isNext}
                  onPress={() => handleTakeSlot(slot)}
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
