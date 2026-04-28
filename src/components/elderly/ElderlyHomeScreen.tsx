// 피보호자 홈 화면.
// 인사말 → [받은 초대 배너] → SOS+병원+약 카드 → 복약 상태 → 안전구역 상태.
// 9-E: ReceivedInvitationsBanner 통합 + ReceivedInvitations 라우트로 이동.
// Pull-to-refresh: 받은 초대 갱신 (복약/안전구역은 Step 11+에서 실연동).

import { StatusBar, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { useToast } from "../../components/common/Toast";
import { ScreenContainer } from "../../components/common/Layout";
import { HomeGreeting } from "../../components/elderly/HomeGreeting";
import { HomeActionGrid } from "../../components/elderly/HomeActionGrid";
import { MedicationStatusCard } from "../../components/elderly/MedicationStatusCard";
import { SafeZoneStatusCard } from "../../components/elderly/SafeZoneStatusCard";
import { ReceivedInvitationsBanner } from "../../components/elderly/ReceivedInvitationsBanner";
import { useAuthStore } from "../../stores/authStore";
import { useBackgroundLocation } from "../../hooks/useBackgroundLocation";
import { useReceivedInvitations } from "../../hooks/useInvitations";
import {
  MOCK_MEDICATION_STATUS,
  MOCK_SAFEZONE_STATUS,
} from "../../mocks/elderlyHomeMock";
import { Colors, Spacing } from "../../theme";
import type { ElderlyHomeAction } from "../../types/elderlyHome";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "ElderlyHome">;

export default function ElderlyHomeScreen() {
  const navigation = useNavigation<Nav>();
  const userName = useAuthStore((s) => s.user?.name) ?? "어르신";
  const userRole = useAuthStore((s) => s.user?.role);
  const toast = useToast();

  useBackgroundLocation(userRole === "elderly");

  // 받은 초대 — PENDING이 1건 이상이면 배너 노출
  const invitationsQuery = useReceivedInvitations();
  const invitations = invitationsQuery.data ?? [];

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await invitationsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [invitationsQuery]);

  const handleAction = (action: ElderlyHomeAction) => {
    if (action === "hospital") {
      navigation.navigate("MedicalChat");
      return;
    }

    const labels: Record<ElderlyHomeAction, string> = {
      sos: "긴급 호출",
      hospital: "병원 찾기",
      medication: "약 챙기기",
    };
    toast.show({
      message: `${labels[action]} 화면으로 이동 (구현 예정)`,
      variant: "info",
    });
  };

  const handleSettings = () => {
    toast.show({
      message: "설정 화면으로 이동 (구현 예정)",
      variant: "info",
    });
  };

  const handleMedicationDetail = () => handleAction("medication");

  const handleInvitationsPress = () => {
    navigation.navigate("ReceivedInvitations");
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <ScreenContainer
        audience="elderly"
        scrollable
        paddingTop={Spacing.md}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <View style={styles.headerSection}>
          <HomeGreeting userName={userName} onSettingsPress={handleSettings} />
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
            status={MOCK_MEDICATION_STATUS}
            onPress={handleMedicationDetail}
          />
        </View>

        <View style={styles.lastSection}>
          <SafeZoneStatusCard status={MOCK_SAFEZONE_STATUS} />
        </View>
      </ScreenContainer>
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
