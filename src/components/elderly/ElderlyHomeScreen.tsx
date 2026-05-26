// 피보호자 홈 화면.
// 인사말 → [받은 초대 배너] → SOS+병원+약 카드 → 복약 상태 → 안전구역 상태.
// 9-E: ReceivedInvitationsBanner 통합 + ReceivedInvitations 라우트로 이동.
// Pull-to-refresh: 받은 초대 갱신 (복약/안전구역은 Step 11+에서 실연동).

import { StatusBar, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import { useToast } from "../../components/common/Toast";
import { ScreenContainer } from "../../components/common/Layout";
import { HomeGreeting } from "../../components/elderly/HomeGreeting";
import { HomeActionGrid } from "../../components/elderly/HomeActionGrid";
import { MedicationStatusCard } from "../../components/elderly/MedicationStatusCard";
import { ReceivedInvitationsBanner } from "../../components/elderly/ReceivedInvitationsBanner";
import { useAuthStore } from "../../stores/authStore";
import { useBackgroundLocation } from "../../hooks/useBackgroundLocation";
import { useFcmTokenRegistration } from "../../hooks/useFcmTokenRegistration";
import { useReceivedInvitations } from "../../hooks/useInvitations";
import {
  useMedicationLogsByDate,
  useMedicationSchedules,
} from "../../hooks/useMedications";
import {
  buildMedicationDailySummary,
  todayDateString,
} from "../../utils/medicationSummary";
import { Colors, Spacing } from "../../theme";
import type { ElderlyHomeAction } from "../../types/elderlyHome";
import type { MedicationStatus } from "../../types/elderlyHome";
import type { RootStackParamList } from "../../types/navigation";
import { FloatingSosButton } from "../../components/elderly/FloatingSosButton";

import { HomeMedicationAnalysisCard } from "../../components/elderly/HomeMedicationAnalysisCard";
import { useMyGuardians } from "../../hooks/useMyGuardians";
import { useSelfMedicationAnalysis } from "../../hooks/useDrugSafety";
import { getMealLabel } from "../../utils/mealLabel";
type Nav = NativeStackNavigationProp<RootStackParamList, "ElderlyHome">;

export default function ElderlyHomeScreen() {
  const navigation = useNavigation<Nav>();
  const userId = useAuthStore((s) => s.user?.id) ?? 0;
  const userName = useAuthStore((s) => s.user?.name) ?? "어르신";
  const userRole = useAuthStore((s) => s.user?.role);
  const toast = useToast();

  const isElder = userRole === "elderly";
  const enabled = isElder && userId > 0;

  const myGuardiansQuery = useMyGuardians(isElder);
  const medicationAnalysisQuery = useSelfMedicationAnalysis();
  const hasGuardian = (myGuardiansQuery.data?.length ?? 0) > 0;
  useBackgroundLocation(isElder && hasGuardian);
  useFcmTokenRegistration(isElder);

  const invitationsQuery = useReceivedInvitations();
  const invitations = invitationsQuery.data ?? [];

  // 복약 실데이터 — MedicationTodayScreen과 동일한 소스.
  const today = todayDateString();
  const schedulesQuery = useMedicationSchedules(userId, { enabled });
  const logsQuery = useMedicationLogsByDate(userId, today, { enabled });

  const medicationStatus: MedicationStatus = useMemo(() => {
    const summary = buildMedicationDailySummary(
      schedulesQuery.data ?? [],
      logsQuery.data ?? [],
    );
    return {
      totalCount: summary.totalCount,
      takenCount: summary.takenCount,
      nextTime: summary.nextTime,
      nextLabel:
        (summary.nextTime ? getMealLabel(summary.nextTime) : null) ??
        summary.nextMedicationName,
      nextIsOverdue: summary.nextIsOverdue,
    };
  }, [schedulesQuery.data, logsQuery.data]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        invitationsQuery.refetch(),
        schedulesQuery.refetch(),
        logsQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [invitationsQuery, schedulesQuery, logsQuery]);

  const handleAction = (action: ElderlyHomeAction) => {
    if (action === "sos") {
      navigation.navigate("Sos");
      return;
    }
    if (action === "hospital") {
      navigation.navigate("MedicalChat");
      return;
    }
    if (action === "medication") {
      navigation.navigate("MedicationList", { protegeId: userId });
      return;
    }

    const labels: Record<ElderlyHomeAction, string> = {
      sos: "긴급 호출",
      hospital: "병원 찾기",
      medication: "복약 일정",
    };
    toast.show({
      message: `${labels[action]} 화면으로 이동 (구현 예정)`,
      variant: "info",
    });
  };
  const handleSettings = () => {
    navigation.navigate("ElderlySettings");
  };

  const handleMedicationDetail = () => navigation.navigate("MedicationToday");
  const handleMedicationAnalysis = () => {
    if (medicationAnalysisQuery.data) {
      navigation.navigate("MedicationAnalysisResult");
    } else {
      navigation.navigate("MedicationAnalysisIntro");
    }
  };
  const handleInvitationsPress = () => {
    navigation.navigate("ReceivedInvitations");
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <View style={{ flex: 1 }}>
        <ScreenContainer
          audience="elderly"
          scrollable
          paddingTop={Spacing.md}
          refreshing={refreshing}
          onRefresh={onRefresh}
        >
          <View style={styles.headerSection}>
            <HomeGreeting
              userName={userName}
              onSettingsPress={handleSettings}
            />
          </View>

          {invitations.length > 0 && (
            <View style={styles.section}>
              <ReceivedInvitationsBanner
                count={invitations.length}
                onPress={handleInvitationsPress}
              />
            </View>
          )}

          <View style={styles.section}>
            <HomeActionGrid onActionPress={handleAction} />
          </View>

          <View style={styles.section}>
            <MedicationStatusCard
              status={medicationStatus}
              onPress={handleMedicationDetail}
            />
          </View>

          <View style={styles.lastSection}>
            <HomeMedicationAnalysisCard onPress={handleMedicationAnalysis} />
          </View>
        </ScreenContainer>
        <FloatingSosButton />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingTop: 0,
    paddingBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  lastSection: {
    marginBottom: Spacing.xl,
  },
});
