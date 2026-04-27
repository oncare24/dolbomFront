// 보호자 홈 화면.
// 인사말+알림종 → 피보호자 카드 리스트 → 초대 카드.
// 카드 탭 → 안전구역 관리(다음 단계). 현재는 toast.

import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";

import { ScreenContainer } from "../../components/common/Layout";
import { useToast } from "../../components/common/Toast";
import { AppText } from "../../components/common/Text";
import { GuardianHomeGreeting } from "../../components/guardian/GuardianHomeGreeting";
import { ProtegeStatusCard } from "../../components/guardian/ProtegeStatusCard";
import { InviteProtegeCard } from "../../components/guardian/InviteProtegeCard";
import { useAuthStore } from "../../stores/authStore";
import { MOCK_PROTEGES } from "../../mocks/guardianHomeMock";
import { Colors, Spacing } from "../../theme";
import type { Protege } from "../../types/guardianHome";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "GuardianHome">;

export default function GuardianHomeScreen() {
  const userName = useAuthStore((s) => s.user?.name) ?? "보호자";
  const toast = useToast();
  const navigation = useNavigation<Nav>();

  const handleNotificationPress = () => {
    toast.show({
      message: "알림 화면 (구현 예정)",
      variant: "info",
    });
  };

  const handleProtegePress = (protege: Protege) => {
    navigation.navigate("SafetyZoneList", { protegeId: protege.id });
  };

  const handleInvitePress = () => {
    toast.show({
      message: "피보호자 초대 화면 (구현 예정)",
      variant: "info",
    });
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <ScreenContainer audience="guardian" scrollable paddingTop={Spacing.md}>
        <View style={styles.headerSection}>
          <GuardianHomeGreeting
            userName={userName}
            hasUnreadNotification
            onNotificationPress={handleNotificationPress}
          />
        </View>

        <View style={styles.section}>
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            style={styles.sectionTitle}
          >
            돌보고 있는 분
          </AppText>
          <View style={styles.list}>
            {MOCK_PROTEGES.map((p) => (
              <ProtegeStatusCard
                key={p.id}
                protege={p}
                onPress={() => handleProtegePress(p)}
              />
            ))}
            <InviteProtegeCard onPress={handleInvitePress} />
          </View>
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  list: {
    gap: Spacing.sm,
  },
});
