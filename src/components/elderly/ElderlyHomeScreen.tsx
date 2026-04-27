// 피보호자 홈 화면.
// 인사말 → SOS+병원+약 카드 → 복약 상태 → 안전구역 상태.
// 병원 찾기 카드 누르면 LLM 문진 채팅으로 이동.

import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useToast } from "../../components/common/Toast";
import { ScreenContainer } from "../../components/common/Layout";
import { HomeGreeting } from "../../components/elderly/HomeGreeting";
import { HomeActionGrid } from "../../components/elderly/HomeActionGrid";
import { MedicationStatusCard } from "../../components/elderly/MedicationStatusCard";
import { SafeZoneStatusCard } from "../../components/elderly/SafeZoneStatusCard";
import { useAuthStore } from "../../stores/authStore";
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
  const toast = useToast();

  const handleAction = (action: ElderlyHomeAction) => {
    if (action === "hospital") {
      navigation.navigate("MedicalChat"); // ★ LLM 문진 채팅으로
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

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <ScreenContainer
        audience="elderly"
        scrollable
        paddingTop={Spacing.md} /* ★ 32dp → 16dp */
      >
        <View style={styles.headerSection}>
          <HomeGreeting userName={userName} onSettingsPress={handleSettings} />
        </View>

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
    paddingTop: 0 /* ★ Spacing.xs → 0 */,
    paddingBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  lastSection: {
    marginBottom: Spacing.xl,
  },
});
