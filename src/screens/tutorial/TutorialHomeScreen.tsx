// [튜토리얼] 피보호자 홈 화면 mock.
// 실제 ElderlyHomeScreen과 동일한 레이아웃.
// 차이점:
//   1) 병원 외 다른 액션 누르면 토스트 안내
//   2) HomeActionGrid를 직접 펼쳐서 "병원 찾기" 카드만 TutorialHighlight로 강조
//   3) HintBubble로 음성+텍스트 안내

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
import { Colors, Spacing } from "../../theme";
import type { ElderlyHomeAction } from "../../types/elderlyHome";
import type { RootStackParamList } from "../../types/navigation";
import { TUTORIAL_HINTS } from "../../constants/tutorialMocks";

type Nav = NativeStackNavigationProp<RootStackParamList, "TutorialHome">;

export default function TutorialHomeScreen() {
  const navigation = useNavigation<Nav>();
  const userName = useAuthStore((s) => s.user?.name) ?? "어르신";
  const toast = useToast();

  const handleAction = (action: ElderlyHomeAction) => {
    if (action === "hospital") {
      navigation.navigate("TutorialMedicalChat");
      return;
    }
    toast.show({
      message: "튜토리얼에서는 ‘병원 찾기’만 연습해요.",
      variant: "info",
    });
  };

  const handleNoop = () => {
    toast.show({
      message: "‘병원 찾기’ 버튼을 눌러 보세요.",
      variant: "info",
    });
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

          {/* HomeActionGrid 직접 펼치기 — 병원 카드만 강조 */}
          <View style={styles.actionGrid}>
            <HomeActionCard
              icon="alert-circle"
              title="긴급 호출"
              description="보호자에게 즉시 알림"
              variant="danger"
              layout="horizontal"
              onPress={() => handleAction("sos")}
            />

            <View style={styles.actionRow}>
              {/* ⭐ 강조 대상 — wrapper 없이 직접 style prop으로 빨간 테두리 */}
              <HomeActionCard
                icon="medkit"
                title="병원 찾기"
                description="병원과 가는 길"
                onPress={() => handleAction("hospital")}
                style={styles.highlightedCard}
              />

              <HomeActionCard
                icon="fitness"
                title="약 챙기기"
                description="오늘 복용 시간"
                onPress={() => handleAction("medication")}
              />
            </View>
          </View>

          <View style={styles.section}>
            <MedicationStatusCard
              status={MOCK_MEDICATION_STATUS}
              onPress={handleNoop}
            />
          </View>

          <View style={styles.lastSection}>
            <SafeZoneStatusCard status={MOCK_SAFEZONE_STATUS} />
          </View>

          {/* HintBubble 가리지 않도록 하단 여백 */}
          <View style={styles.bottomSpacer} />
        </ScreenContainer>

        <TutorialHintBubble text={TUTORIAL_HINTS.home} />
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
  highlightedCard: {
    borderWidth: 4,
    borderColor: Colors.semantic.danger,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  lastSection: {
    marginBottom: Spacing.xl,
  },
  bottomSpacer: {
    height: 160,
  },
});
