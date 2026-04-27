// 보호자 홈 화면.
// 인사말+알림종 → 피보호자 카드 리스트 → 초대 카드 → 로그아웃(임시).
//
// 학습 포인트 (추동훈용):
//   - useMe(): useQuery 사용. 마운트 시 자동으로 GET /api/users/me 호출 → 캐싱
//   - useLogout(): useMutation 사용. 버튼 클릭 시 .mutate()로 명시적 호출

import React from "react";
import { Alert, Pressable, StatusBar, StyleSheet, View } from "react-native";

import { ScreenContainer } from "../../components/common/Layout";
import { useToast } from "../../components/common/Toast";
import { AppText } from "../../components/common/Text";
import { GuardianHomeGreeting } from "../../components/guardian/GuardianHomeGreeting";
import { ProtegeStatusCard } from "../../components/guardian/ProtegeStatusCard";
import { InviteProtegeCard } from "../../components/guardian/InviteProtegeCard";
import { useAuthStore } from "../../stores/authStore";
import { useMe } from "../../hooks/useMe";
import { useLogout } from "../../hooks/useLogout";
import { MOCK_PROTEGES } from "../../mocks/guardianHomeMock";
import { Colors, Spacing } from "../../theme";
import type { Protege } from "../../types/guardianHome";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "GuardianHome">;

export default function GuardianHomeScreen() {
  const toast = useToast();
  const navigation = useNavigation<Nav>();

  // ★ useQuery 표본: 마운트 시 자동으로 /api/users/me 호출, 5분간 캐싱
  const { data: me, isLoading: meLoading } = useMe();

  // 캐시된 user(Zustand)는 fallback. me가 도착하면 me.name 우선 사용
  const fallbackName = useAuthStore((s) => s.user?.name) ?? "보호자";
  const userName = me?.name ?? fallbackName;

  // ★ useMutation 표본: 버튼 클릭 시 .mutate()로 호출
  const logoutMutation = useLogout();

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

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠어요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: () => logoutMutation.mutate(),
      },
    ]);
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

        {/* TODO 발표 후: 별도 설정 화면(우상단 톱니바퀴)으로 이동 */}
        <Pressable
          onPress={handleLogout}
          disabled={logoutMutation.isPending}
          style={styles.logoutBtn}
          hitSlop={8}
        >
          <AppText variant="body" color="link">
            {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
          </AppText>
        </Pressable>
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
  logoutBtn: {
    alignSelf: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
});
