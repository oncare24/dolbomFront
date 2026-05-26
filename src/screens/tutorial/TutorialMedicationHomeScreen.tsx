// [튜토리얼] 복약 — 피보호자 홈 화면 mock.
// 실제 ElderlyHomeScreen과 동일한 레이아웃. 복약 튜토리얼 1단계.
// 차이점:
//   1) "오늘의 약" 카드만 빨간 테두리로 강조
//   2) 그 외 액션은 토스트 안내
//   3) HintBubble로 음성+텍스트 안내
//   4) "오늘의 약" 탭 → TutorialMedicationToday 로 이동

import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useToast } from "../../components/common/Toast";
import { ScreenContainer } from "../../components/common/Layout";
import { HomeGreeting } from "../../components/elderly/HomeGreeting";
import { HomeActionCard } from "../../components/elderly/HomeActionCard";
import { MedicationStatusCard } from "../../components/elderly/MedicationStatusCard";
import { SafeZoneStatusCard } from "../../components/elderly/SafeZoneStatusCard";
import { TutorialHintBubble } from "../../components/tutorial/TutorialHintBubble";
import { useAuthStore } from "../../stores/authStore";
import {
  MOCK_MEDICATION_STATUS,
  MOCK_SAFEZONE_STATUS,
} from "../../mocks/elderlyHomeMock";
import { Colors, Radius, Spacing } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";
import { TUTORIAL_HINTS } from "../../constants/tutorialMocks";

type Nav = NativeStackNavigationProp<RootStackParamList, "TutorialMedicationHome">;

export default function TutorialMedicationHomeScreen() {
  const navigation = useNavigation<Nav>();
  const userName = useAuthStore((s) => s.user?.name) ?? "어르신";
  const toast = useToast();

  // "오늘의 약" 외 액션은 토스트로 안내만.
  const handleNoop = () => {
    toast.show({
      message: "‘오늘의 약’을 눌러 보세요.",
      variant: "info",
    });
  };

  // "오늘의 약" 카드 → 다음 단계
  const handleGoToday = () => {
    navigation.navigate("TutorialMedicationToday");
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <View style={{ flex: 1 }}>
        <ScreenContainer audience="elderly" scrollable paddingTop={Spacing.md}>
          <View style={styles.headerSection}>
            <HomeGreeting userName={userName} onSettingsPress={handleNoop} />
          </View>

          <View style={styles.actionGrid}>
            <HomeActionCard
              icon="alert-circle"
              title="긴급 호출"
              description="보호자에게 즉시 알림"
              variant="danger"
              layout="horizontal"
              onPress={handleNoop}
            />

            <View style={styles.actionRow}>
              <HomeActionCard
                icon="medkit"
                title="병원 찾기"
                description="병원과 가는 길"
                onPress={handleNoop}
              />
              <HomeActionCard
                icon="fitness"
                title="약 챙기기"
                description="오늘 복용 시간"
                onPress={handleNoop}
              />
            </View>
          </View>

          {/* ⭐ 강조 대상 — "오늘의 약" 카드를 빨간 테두리로 감쌈 */}
          <View style={styles.section}>
            <View style={styles.highlightWrap}>
              <MedicationStatusCard
                status={MOCK_MEDICATION_STATUS}
                onPress={handleGoToday}
              />
            </View>
          </View>

          <View style={styles.lastSection}>
            <SafeZoneStatusCard status={MOCK_SAFEZONE_STATUS} />
          </View>

          <View style={styles.bottomSpacer} />
        </ScreenContainer>

        <TutorialHintBubble text={TUTORIAL_HINTS.medication_home} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingTop: 0,
    paddingBottom: Spacing.lg,
  },
  actionGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  highlightWrap: {
    borderWidth: 4,
    borderColor: Colors.semantic.danger,
    borderRadius: Radius.xl,
  },
  lastSection: {
    marginBottom: Spacing.xl,
  },
  bottomSpacer: {
    height: 160,
  },
});
