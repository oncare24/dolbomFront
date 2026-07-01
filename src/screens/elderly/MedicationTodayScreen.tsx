// src/screens/elderly/MedicationTodayScreen.tsx

// 피보호자 — 오늘의 약 화면.
// 4-2 today API 사용: 서버가 그날 유효 일정(요일/기간/회차) 필터 + 성분별 복용 상태 계산.
// 프론트는 "다음 회차(isNext)"만 현재 시각으로 계산.

import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { useToast } from "../../components/common/Toast";
import { MedicationProgressCard } from "../../components/elderly/MedicationProgressCard";
import { MedicationManageButton } from "../../components/medication/MedicationManageButton";
import { MedicationTodayError } from "../../components/medication/MedicationTodayError";
import { MedicationTodayEmpty } from "../../components/medication/MedicationTodayEmpty";
import { useAuthStore } from "../../stores/authStore";
import {
  useMedicationToday,
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
import type { TodayMedicationSlot } from "../../types/medication";
import type { RootStackParamList } from "../../types/navigation";
import { MedicationSlotCard } from "../../components/elderly/MedicationSlotCard";

type Nav = NativeStackNavigationProp<RootStackParamList, "MedicationToday">;

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
    data: slots = [],
    isLoading,
    isError,
    refetch,
  } = useMedicationToday(protegeId, today, { enabled });

  const takeMutation = useTakeMedication();

  const { displaySlots, totalSlots, takenSlots, allDone } = useMemo(() => {
    // 다음 회차: 미완료 중 현재 시각 이후 가장 가까운, 없으면 가장 이른 미완료
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const remaining = slots
      .filter((s) => !s.allTaken)
      .map((s) => {
        const [h, m] = s.scheduledTime.split(":").map(Number);
        return { time: s.scheduledTime, minutes: h * 60 + m };
      })
      .sort((a, b) => a.minutes - b.minutes);
    const nextTime =
      (remaining.find((x) => x.minutes >= nowMinutes) ?? remaining[0])?.time ??
      null;

    const display = slots.map((s) => ({
      ...s,
      isNext: s.scheduledTime === nextTime,
    }));
    const total = slots.length;
    const taken = slots.filter((s) => s.allTaken).length;

    return {
      displaySlots: display,
      totalSlots: total,
      takenSlots: taken,
      allDone: total > 0 && taken === total,
    };
  }, [slots, now]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleTakeSlot = (slot: TodayMedicationSlot) => {
    if (slot.allTaken) {
      toast.show({
        message: "이미 복용으로 표시된 시간이에요",
        variant: "info",
        durationMs: 1500,
      });
      return;
    }
    haptic.success();
    const takenAt = nowLocalDateTimeIso();
    for (const item of slot.items) {
      if (item.taken) continue; // 이미 기록된 약은 건너뜀
      takeMutation.mutate(
        {
          protegeId,
          scheduleId: item.scheduleId,
          takenAt,
          medicationName: item.name,
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

  const isInitialLoading = enabled && isLoading && slots.length === 0;

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
        ) : isError ? (
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
                const next = displaySlots.find((s) => s.isNext && !s.allTaken);
                return next
                  ? `${timeSlotLabel(next.scheduledTime)} ${toKoreanTime(next.scheduledTime)}`
                  : null;
              })()}
            />
            <View style={styles.list}>
              {displaySlots.map((slot) => (
                <MedicationSlotCard
                  key={slot.scheduledTime}
                  time={slot.scheduledTime}
                  medicationNames={slot.items.map((i) => i.name)}
                  isTaken={slot.allTaken}
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
