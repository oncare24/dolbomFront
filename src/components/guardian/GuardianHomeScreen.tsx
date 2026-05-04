// 보호자 홈 화면.
// 인사말+알림종 → [대기 중인 초대 섹션] → 피보호자 카드 리스트 → 초대 카드 → 로그아웃.
//
// 9-F: MOCK_PROTEGES 제거 → useMyWards 실데이터.
// Pull-to-refresh: ward 목록 + 보낸 초대 둘 다 동시 갱신.

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

import { ScreenContainer } from "../../components/common/Layout";
import { useToast } from "../../components/common/Toast";
import { AppText } from "../../components/common/Text";
import { GuardianHomeGreeting } from "../../components/guardian/GuardianHomeGreeting";
import { ProtegeStatusCard } from "../../components/guardian/ProtegeStatusCard";
import { InviteProtegeCard } from "../../components/guardian/InviteProtegeCard";
import { SentInvitationCard } from "../../components/guardian/SentInvitationCard";
import { useAuthStore } from "../../stores/authStore";
import { useMe } from "../../hooks/useMe";
import { useLogout } from "../../hooks/useLogout";
import {
  useCancelInvitation,
  useSentInvitations,
} from "../../hooks/useInvitations";
import { useMyWards } from "../../hooks/useMyWards";
import { useFcmTokenRegistration } from "../../hooks/useFcmTokenRegistration";
import { useUnreadCount } from "../../hooks/useNotifications";
import { Colors, Spacing } from "../../theme";
import type { Protege } from "../../types/guardianHome";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "GuardianHome">;

export default function GuardianHomeScreen() {
  const toast = useToast();
  const navigation = useNavigation<Nav>();

  const { data: me } = useMe();
  const fallbackName = useAuthStore((s) => s.user?.name) ?? "보호자";
  const userName = me?.name ?? fallbackName;
  useFcmTokenRegistration(true);
  const { data: unreadCountData, refetch: refetchUnreadCount } =
    useUnreadCount();
  const hasUnread = (unreadCountData?.count ?? 0) > 0;
  const {
    data: wards = [],
    isLoading: wardsLoading,
    isError: wardsError,
    refetch: refetchWards,
  } = useMyWards();

  const sentInvitationsQuery = useSentInvitations();
  const sentInvitations = sentInvitationsQuery.data ?? [];

  const cancelMutation = useCancelInvitation();
  const logoutMutation = useLogout();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchWards(),
        sentInvitationsQuery.refetch(),
        refetchUnreadCount(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchWards, sentInvitationsQuery, refetchUnreadCount]);

  const handleNotificationPress = () => {
    navigation.navigate("Notifications");
  };
  const handleProtegePress = (protege: Protege) => {
    navigation.navigate("SafetyZoneList", { protegeId: protege.id });
  };

  const handleInvitePress = () => {
    navigation.navigate("InviteWard");
  };

  const handleCancelInvitation = (id: number) => {
    cancelMutation.mutate(id, {
      onSuccess: () => {
        toast.show({ message: "초대를 취소했어요", variant: "success" });
      },
      onError: () => {
        toast.show({
          message: "취소에 실패했어요. 잠시 후 다시 시도해주세요",
          variant: "error",
        });
      },
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
      <ScreenContainer
        audience="guardian"
        scrollable
        paddingTop={Spacing.md}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <View style={styles.headerSection}>
          <GuardianHomeGreeting
            userName={userName}
            unreadCount={unreadCountData?.count ?? 0}
            onNotificationPress={handleNotificationPress}
          />
        </View>

        {sentInvitations.length > 0 && (
          <View style={styles.section}>
            <AppText
              variant="caption"
              audience="guardian"
              color="secondary"
              style={styles.sectionTitle}
            >
              대기 중인 초대
            </AppText>
            <View style={styles.list}>
              {sentInvitations.map((inv) => (
                <SentInvitationCard
                  key={inv.id}
                  invitation={inv}
                  onCancel={handleCancelInvitation}
                  isCancelling={
                    cancelMutation.isPending &&
                    cancelMutation.variables === inv.id
                  }
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            style={styles.sectionTitle}
          >
            돌보고 있는 분
          </AppText>

          {wardsLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={Colors.brand.primary} />
            </View>
          ) : wardsError ? (
            <Pressable onPress={() => refetchWards()} style={styles.errorBox}>
              <AppText variant="caption" color="danger">
                목록을 불러오지 못했어요. 눌러서 다시 시도
              </AppText>
            </Pressable>
          ) : (
            <View style={styles.list}>
              {wards.map((p) => (
                <ProtegeStatusCard
                  key={p.id}
                  protege={p}
                  onPress={() => handleProtegePress(p)}
                />
              ))}
              <InviteProtegeCard onPress={handleInvitePress} />
            </View>
          )}
        </View>

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
  loading: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  errorBox: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.semantic.dangerBg,
    borderRadius: Spacing.sm,
    alignItems: "center",
  },
  logoutBtn: {
    alignSelf: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
});
