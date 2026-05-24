// 보호자 — 피보호자 약물 안전 분석 상세.

import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { PrimaryButton } from "../../components/common/Button";
import { BottomActionBar } from "../../components/common/BottomActionBar";
import { useToast } from "../../components/common/Toast";
import { GuardianMedicationWarningCard } from "../../components/guardian/GuardianMedicationWarningCard";
import { useRequestAnalysisRefresh } from "../../hooks/useDrugSafety";
import { useMyWards } from "../../hooks/useMyWards";
import { useWardMedicationAnalysis } from "../../hooks/useDrugSafety";
import {
  formatAnalyzedAt,
  getAnalysisFreshness,
  sortWarningsBySeverity,
} from "../../utils/drugSafety";
import { ApiException } from "../../services/api";
import { Colors, Radius, Spacing } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";
import { PrescriptionCardGuardian } from "../../components/guardian/PrescriptionCardGuardian";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

type Route = RouteProp<RootStackParamList, "MedicationAnalysisDetail">;
type Nav = NativeStackNavigationProp<
  RootStackParamList,
  "MedicationAnalysisDetail"
>;
import { cleanField, groupPrescriptions } from "../../utils/prescription";

export default function MedicationAnalysisDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const toast = useToast();
  const protegeId = route.params.protegeId;

  const { data: wards = [] } = useMyWards();
  const protege = wards.find((w) => w.id === protegeId);
  const protegeName = protege?.name ?? "피보호자";

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useWardMedicationAnalysis(protegeId);

  const noAnalysis =
    isError && error instanceof ApiException && error.code === "D001";

  // 재분석 요청 — Stage 6+ 에서 푸시 발사 백엔드 endpoint 연결 예정.
  const { mutateAsync: requestRefresh, isPending: isRequestingRefresh } =
    useRequestAnalysisRefresh();

  const handleRequestRefresh = useCallback(async () => {
    try {
      await requestRefresh(protegeId);
      toast.show({
        message: `${protegeName}님께 처방전 분석 요청을 보냈어요`,
        variant: "success",
      });
    } catch (e) {
      if (!(e instanceof ApiException)) {
        toast.show({
          message: "요청을 보내지 못했어요",
          variant: "error",
        });
      }
    }
  }, [requestRefresh, protegeId, protegeName, toast]);

  const scrollRef = useRef<ScrollView>(null);
  const sectionYRef = useRef(0);
  const listYRef = useRef(0);
  const cardYsRef = useRef<Record<string, number>>({});
  const [highlightedName, setHighlightedName] = useState<string | null>(null);

  // ─── 로딩 ───
  if (isLoading) {
    return (
      <View style={styles.root}>
        <AppHeader title="약물 안전 분석" audience="guardian" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
          <AppText
            variant="body"
            audience="guardian"
            color="secondary"
            style={styles.loadingText}
          >
            분석 결과를 불러오는 중이에요
          </AppText>
        </View>
      </View>
    );
  }

  // ─── 분석 이력 없음 ───
  if (noAnalysis) {
    return (
      <View style={styles.root}>
        <AppHeader title="약물 안전 분석" audience="guardian" />
        <View style={styles.emptyWrap}>
          <Ionicons
            name="document-text-outline"
            size={72}
            color={Colors.gray[400]}
          />
          <AppText variant="h2" audience="guardian" style={styles.emptyTitle}>
            아직 분석이 없어요
          </AppText>
          <AppText
            variant="body"
            audience="guardian"
            color="secondary"
            style={styles.emptyBody}
          >
            {protegeName}님이 처방전 분석을 진행해야{"\n"}여기서 결과를 확인할
            수 있어요.
          </AppText>
        </View>
        <BottomActionBar audience="guardian">
          <PrimaryButton
            label="분석 요청하기"
            audience="guardian"
            loading={isRequestingRefresh}
            onPress={handleRequestRefresh}
          />
        </BottomActionBar>
      </View>
    );
  }

  // ─── 기타 에러 ───
  if (isError || !data) {
    return (
      <View style={styles.root}>
        <AppHeader title="약물 안전 분석" audience="guardian" />
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={56}
            color={Colors.semantic.warning}
          />
          <AppText variant="h3" audience="guardian" style={styles.errorTitle}>
            결과를 불러오지 못했어요
          </AppText>
        </View>
        <BottomActionBar audience="guardian">
          <PrimaryButton
            label="다시 시도"
            audience="guardian"
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
  const isStale = freshness === "STALE";

  // severity 카운트 (요약 표시용)
  const severityCounts = sortedWarnings.reduce((acc, w) => {
    acc[w.severity] = (acc[w.severity] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handlePressDrug = (name: string) => {
    const key = cleanField(name);
    const cardY = cardYsRef.current[key];
    if (cardY == null) return;
    const y = Math.max(0, sectionYRef.current + listYRef.current + cardY - 12);
    scrollRef.current?.scrollTo({ y, animated: true });
    setHighlightedName(key);
    setTimeout(() => setHighlightedName(null), 2500);
  };

  return (
    <View style={styles.root}>
      <AppHeader title="약물 안전 분석" audience="guardian" />

      <ScreenContainer
        ref={scrollRef}
        audience="guardian"
        scrollable
        paddingTop={Spacing.md}
        refreshing={isRefetching}
        onRefresh={refetch}
      >
        {/* 요약 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View
              style={[
                styles.summaryIcon,
                {
                  backgroundColor: isClean
                    ? Colors.semantic.success
                    : Colors.semantic.warning,
                },
              ]}
            >
              <Ionicons
                name={isClean ? "shield-checkmark" : "warning"}
                size={28}
                color={Colors.text.inverse}
              />
            </View>
            <View style={styles.summaryHeaderText}>
              <AppText variant="h2" audience="guardian">
                {isClean ? "안전" : `주의 ${sortedWarnings.length}건`}
              </AppText>
              <AppText
                variant="caption"
                audience="guardian"
                color={isOutdated ? "danger" : "secondary"}
                style={styles.analyzedAt}
              >
                {protegeName}님 · {formatAnalyzedAt(data.analyzedAt)}
                {isOutdated && " · 업데이트 권장"}
              </AppText>
              {(data.prescriptions?.length ?? 0) > 0 && (
                <AppText
                  variant="caption"
                  audience="guardian"
                  color="secondary"
                  style={styles.summaryStat}
                >
                  처방 약 {data.prescriptions.length}건 ·{" "}
                  {prescriptionGroups.length}종
                </AppText>
              )}
            </View>
          </View>

          {!isClean && (
            <View style={styles.severitySummary}>
              {severityCounts.CRITICAL > 0 && (
                <SeverityChip
                  label="매우 위험"
                  count={severityCounts.CRITICAL}
                  bg={Colors.semantic.dangerBg}
                  text={Colors.semantic.danger}
                />
              )}
              {severityCounts.HIGH > 0 && (
                <SeverityChip
                  label="위험"
                  count={severityCounts.HIGH}
                  bg={Colors.semantic.warningBg}
                  text={Colors.semantic.warning}
                />
              )}
              {severityCounts.MEDIUM > 0 && (
                <SeverityChip
                  label="주의"
                  count={severityCounts.MEDIUM}
                  bg="#F3E8FF"
                  text="#6B21A8"
                />
              )}
              {severityCounts.LOW > 0 && (
                <SeverityChip
                  label="참고"
                  count={severityCounts.LOW}
                  bg={Colors.semantic.infoBg}
                  text={Colors.semantic.info}
                />
              )}
            </View>
          )}

          {isStale && !isOutdated && (
            <View style={styles.staleNotice}>
              <Ionicons
                name="time-outline"
                size={16}
                color={Colors.text.secondary}
              />
              <AppText
                variant="caption"
                audience="guardian"
                color="secondary"
                style={styles.staleText}
              >
                분석한 지 일주일이 지났어요. 최근 처방이 있다면 업데이트를
                권장해 주세요.
              </AppText>
            </View>
          )}
        </View>

        {/* 경고 카드 또는 안전 메시지 */}
        {isClean ? (
          <View style={styles.cleanBlock}>
            <AppText
              variant="body"
              audience="guardian"
              color="secondary"
              style={styles.cleanText}
            >
              현재 처방받은 약물에서 주의해야 할 조합이 발견되지 않았습니다.
            </AppText>
          </View>
        ) : (
          <View style={styles.warningList}>
            {sortedWarnings.map((w, i) => (
              <GuardianMedicationWarningCard
                key={i}
                warning={w}
                onPressDrug={handlePressDrug}
              />
            ))}
          </View>
        )}

        {prescriptionGroups.length > 0 && (
          <View
            style={styles.prescriptionsSection}
            onLayout={(e) => {
              sectionYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeader}>
              <AppText variant="h3" audience="guardian">
                처방받은 약
              </AppText>
              <AppText variant="caption" audience="guardian" color="secondary">
                {prescriptionGroups.length}종
              </AppText>
            </View>
            <View
              style={styles.prescriptionList}
              onLayout={(e) => {
                listYRef.current = e.nativeEvent.layout.y;
              }}
            >
              {prescriptionGroups.map((g, i) => {
                const key = cleanField(g.prescription.resDrugName);
                return (
                  <View
                    key={i}
                    onLayout={(e) => {
                      cardYsRef.current[key] = e.nativeEvent.layout.y;
                    }}
                    style={
                      highlightedName === key ? styles.highlight : undefined
                    }
                  >
                    <PrescriptionCardGuardian group={g} />
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScreenContainer>

      <BottomActionBar audience="guardian">
        <PrimaryButton
          label="재분석 요청하기"
          audience="guardian"
          loading={isRequestingRefresh}
          onPress={handleRequestRefresh}
        />
      </BottomActionBar>
    </View>
  );
}

// ─── 보조 컴포넌트 ───

interface SeverityChipProps {
  label: string;
  count: number;
  bg: string;
  text: string;
}

function SeverityChip({ label, count, bg, text }: SeverityChipProps) {
  return (
    <View style={[styles.severityChip, { backgroundColor: bg }]}>
      <AppText
        variant="caption"
        audience="guardian"
        style={[styles.severityChipText, { color: text }]}
      >
        {label} {count}
      </AppText>
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
    marginTop: Spacing.md,
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
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  analyzedAt: {
    marginTop: 2,
  },
  severitySummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  severityChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  severityChipText: {
    fontWeight: "700",
  },
  staleNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.gray[100],
    borderRadius: Radius.sm,
  },
  staleText: {
    flex: 1,
    lineHeight: 18,
  },
  warningList: {
    gap: Spacing.md,
  },
  cleanBlock: {
    backgroundColor: Colors.surface.card,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  cleanText: {
    textAlign: "center",
  },
  summaryStat: {
    marginTop: 2,
  },
  prescriptionsSection: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  prescriptionList: {
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  highlight: {
    borderWidth: 2,
    borderColor: Colors.semantic.info,
    borderRadius: Radius.lg,
  },
});
