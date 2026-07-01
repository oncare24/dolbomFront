// src/screens/guardian/GuardianMedicationOverviewScreen.tsx
//
// 보호자 — 피보호자 "오늘 복약 한눈에" 오버뷰.
// 고령자용 큰 버튼/한 번에 하나 화면과 달리, 보호자는 하루 전체를 스캔(관찰·감독)해야 하므로
// 같은 데이터를 "전체 스케줄 + 순응도"로 재구성한다.
//   - 상단: 오늘 순응도 세그먼트 바 (복용/안 드심/예정) + 수치
//   - 본문: 시간대(아침/점심/저녁/밤) 타임라인 — 약마다 상태색 + 약별 색 점으로 구분
//   - 헤더 "관리" → 기존 복약 목록(편집)
//
// 데이터는 현재 API 그대로 (useMedicationSchedules + logsByDate + getMedicationTodayStatus).
// 봉지(DoseGroup) 모델이 들어와도 "시간대 슬롯" 표현은 그대로 유지되므로 안전.

import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StatusBar, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { useMyWards } from "../../hooks/useMyWards";
import {
  useMedicationLogsByDate,
  useMedicationSchedules,
} from "../../hooks/useMedications";
import {
  getMedicationTodayStatus,
  type MedicationTodayStatus,
} from "../../utils/medicationStatus";
import { todayDateString } from "../../utils/medicationSummary";
import { medicationColor } from "../../utils/medicationColor";
import { timeSlotLabel } from "../../utils/mealLabel";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import type { MedicationSchedule } from "../../types/medication";
import type { RootStackParamList } from "../../types/navigation";

type Route = RouteProp<RootStackParamList, "GuardianMedicationOverview">;
type Nav = NativeStackNavigationProp<
  RootStackParamList,
  "GuardianMedicationOverview"
>;

type LiveKind = "TAKEN" | "MISSED" | "UPCOMING";

const STATUS_META: Record<
  LiveKind,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  TAKEN: { icon: "checkmark-circle", color: Colors.semantic.success, label: "복용" },
  MISSED: { icon: "alert-circle", color: Colors.semantic.warning, label: "안 드심" },
  UPCOMING: { icon: "ellipse-outline", color: Colors.text.disabled, label: "예정" },
};

interface SlotMed {
  schedule: MedicationSchedule;
  kind: LiveKind;
}
interface Slot {
  time: string;
  hour: number;
  meds: SlotMed[];
  taken: number;
  missed: number;
  total: number;
}

export default function GuardianMedicationOverviewScreen() {
  const navigation = useNavigation<Nav>();
  const { protegeId } = useRoute<Route>().params;
  const today = todayDateString();

  const { data: wards = [] } = useMyWards();
  const wardName = wards.find((w) => w.id === protegeId)?.name ?? "피보호자";

  const { data: schedules = [], refetch: refetchSchedules } =
    useMedicationSchedules(protegeId, { enabled: protegeId > 0 });
  const { data: todayLogs = [], refetch: refetchLogs } =
    useMedicationLogsByDate(protegeId, today, { enabled: protegeId > 0 });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchSchedules(), refetchLogs()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchSchedules, refetchLogs]);

  useFocusEffect(
    useCallback(() => {
      refetchSchedules();
      refetchLogs();
    }, [refetchSchedules, refetchLogs]),
  );

  const { slots, total, taken, missed, upcoming } = useMemo(() => {
    const now = new Date();
    const byTime = new Map<string, SlotMed[]>();
    for (const s of schedules) {
      if (!s.active) continue;
      const status: MedicationTodayStatus = getMedicationTodayStatus(
        s,
        todayLogs,
        now,
      );
      if (status.kind === "NOT_TODAY") continue; // 오늘 대상 아님 → 제외
      const list = byTime.get(s.scheduledTime) ?? [];
      list.push({ schedule: s, kind: status.kind });
      byTime.set(s.scheduledTime, list);
    }

    const slotList: Slot[] = Array.from(byTime.entries())
      .map(([time, meds]) => {
        const hour = parseInt(time.split(":")[0], 10);
        return {
          time,
          hour,
          meds,
          taken: meds.filter((m) => m.kind === "TAKEN").length,
          missed: meds.filter((m) => m.kind === "MISSED").length,
          total: meds.length,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    const tot = slotList.reduce((n, s) => n + s.total, 0);
    const tk = slotList.reduce((n, s) => n + s.taken, 0);
    const md = slotList.reduce((n, s) => n + s.missed, 0);
    return {
      slots: slotList,
      total: tot,
      taken: tk,
      missed: md,
      upcoming: tot - tk - md,
    };
  }, [schedules, todayLogs]);

  const goManage = () => navigation.navigate("MedicationList", { protegeId });

  const manageButton = (
    <Pressable
      onPress={goManage}
      hitSlop={8}
      style={styles.manageBtn}
      accessibilityRole="button"
      accessibilityLabel="복약 관리"
    >
      <Ionicons name="create-outline" size={18} color={Colors.brand.primary} />
      <AppText
        variant="caption"
        audience="guardian"
        style={styles.manageBtnText}
      >
        관리
      </AppText>
    </Pressable>
  );

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <AppHeader
        title={`${wardName}님 복약`}
        audience="guardian"
        rightElement={manageButton}
      />

      <ScreenContainer
        audience="guardian"
        scrollable
        paddingTop={Spacing.md}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {total === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="medkit-outline"
              size={44}
              color={Colors.text.disabled}
            />
            <AppText
              variant="bodyBold"
              audience="guardian"
              color="primary"
              style={styles.emptyTitle}
            >
              오늘 복약 일정이 없어요
            </AppText>
            <Pressable onPress={goManage} hitSlop={8}>
              <AppText
                variant="caption"
                audience="guardian"
                style={styles.emptyLink}
              >
                복약 일정 관리하기
              </AppText>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ── 순응도 요약 ── */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <AppText
                  variant="bodyBold"
                  audience="guardian"
                  color="primary"
                >
                  오늘 복약
                </AppText>
                <View style={styles.summaryCount}>
                  <AppText variant="h2" audience="guardian" color="primary">
                    {taken}
                  </AppText>
                  <AppText
                    variant="body"
                    audience="guardian"
                    color="secondary"
                  >
                    {` / ${total}`}
                  </AppText>
                </View>
              </View>

              <View style={styles.bar}>
                {taken > 0 && (
                  <View
                    style={[
                      styles.barSeg,
                      { flex: taken, backgroundColor: Colors.semantic.success },
                    ]}
                  />
                )}
                {missed > 0 && (
                  <View
                    style={[
                      styles.barSeg,
                      { flex: missed, backgroundColor: Colors.semantic.warning },
                    ]}
                  />
                )}
                {upcoming > 0 && (
                  <View
                    style={[
                      styles.barSeg,
                      { flex: upcoming, backgroundColor: Colors.gray[300] },
                    ]}
                  />
                )}
              </View>

              <View style={styles.legendRow}>
                <Legend color={Colors.semantic.success} label={`복용 ${taken}`} />
                <Legend color={Colors.semantic.warning} label={`안 드심 ${missed}`} />
                <Legend color={Colors.gray[300]} label={`예정 ${upcoming}`} />
              </View>
            </View>

            {/* ── 시간대 타임라인 ── */}
            <View style={styles.timeline}>
              {slots.map((slot) => {
                const allTaken = slot.taken === slot.total;
                const hasMissed = slot.missed > 0;
                return (
                  <View
                    key={slot.time}
                    style={[
                      styles.slotCard,
                      hasMissed && styles.slotCardMissed,
                    ]}
                  >
                    <View style={styles.slotHead}>
                      <View style={styles.slotHeadLeft}>
                        <AppText
                          variant="bodyBold"
                          audience="guardian"
                          color="primary"
                        >
                          {timeSlotLabel(slot.time)}
                        </AppText>
                        <AppText
                          variant="caption"
                          audience="guardian"
                          color="secondary"
                          style={styles.slotTime}
                        >
                          {slot.time}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.slotBadge,
                          {
                            backgroundColor: hasMissed
                              ? Colors.semantic.warningBg
                              : allTaken
                                ? Colors.semantic.successBg
                                : Colors.gray[100],
                          },
                        ]}
                      >
                        <AppText
                          variant="caption"
                          audience="guardian"
                          style={{
                            color: hasMissed
                              ? Colors.semantic.warning
                              : allTaken
                                ? Colors.semantic.success
                                : Colors.text.secondary,
                            fontWeight: "700",
                          }}
                        >
                          {hasMissed
                            ? `안 드심 ${slot.missed}`
                            : `${slot.taken}/${slot.total} 복용`}
                        </AppText>
                      </View>
                    </View>

                    {slot.meds.map(({ schedule, kind }) => {
                      const meta = STATUS_META[kind];
                      return (
                        <View key={schedule.id} style={styles.medRow}>
                          <View
                            style={[
                              styles.medDot,
                              {
                                backgroundColor: medicationColor(
                                  schedule.medicationName,
                                ),
                              },
                            ]}
                          />
                          <AppText
                            variant="body"
                            audience="guardian"
                            color="primary"
                            numberOfLines={1}
                            style={styles.medName}
                          >
                            {schedule.medicationName}
                          </AppText>
                          <Ionicons
                            name={meta.icon}
                            size={18}
                            color={meta.color}
                          />
                          <AppText
                            variant="caption"
                            audience="guardian"
                            style={[styles.medStatus, { color: meta.color }]}
                          >
                            {meta.label}
                          </AppText>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScreenContainer>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText variant="caption" audience="guardian" color="secondary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
  },
  manageBtnText: {
    color: Colors.brand.primary,
    fontWeight: "700",
  },

  emptyBox: {
    flex: 1,
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  emptyTitle: { marginTop: Spacing.xs },
  emptyLink: { color: Colors.brand.primary, fontWeight: "700" },

  // 순응도 요약
  summaryCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Elevation.sm,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  summaryCount: { flexDirection: "row", alignItems: "flex-end" },
  bar: {
    flexDirection: "row",
    height: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray[200],
    overflow: "hidden",
  },
  barSeg: { height: "100%" },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },

  // 타임라인
  timeline: { gap: Spacing.sm, paddingBottom: Spacing.lg },
  slotCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Elevation.sm,
  },
  slotCardMissed: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.semantic.warning,
  },
  slotHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  slotHeadLeft: { flexDirection: "row", alignItems: "baseline", gap: Spacing.xs },
  slotTime: {},
  slotBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: Spacing.xs,
  },
  medDot: { width: 12, height: 12, borderRadius: 6 },
  medName: { flex: 1 },
  medStatus: { fontWeight: "700", minWidth: 44, textAlign: "right" },
});
