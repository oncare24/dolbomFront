// 어르신이 받은 보호자 등록 요청 목록 화면.
// 빈 상태도 친절하게 표시 + pull-to-refresh로 새 요청 확인 가능.

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader } from "../../components/common/Header";
import { ScreenContainer } from "../../components/common/Layout";
import { AppText } from "../../components/common/Text";
import { useToast } from "../../components/common/Toast";
import { ReceivedInvitationCard } from "../../components/elderly/ReceivedInvitationCard";
import {
  useAcceptInvitation,
  useReceivedInvitations,
  useRejectInvitation,
} from "../../hooks/useInvitations";
import { ApiException } from "../../services/api";
import { Colors, Spacing } from "../../theme";
import { FloatingSosButton } from "../../components/elderly/FloatingSosButton";
export default function InvitationListScreen() {
  const toast = useToast();
  const {
    data: invitations = [],
    isLoading,
    refetch: refetchInvitations,
  } = useReceivedInvitations();
  const acceptMutation = useAcceptInvitation();
  const rejectMutation = useRejectInvitation();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchInvitations();
    } finally {
      setRefreshing(false);
    }
  }, [refetchInvitations]);

  const processingId =
    (acceptMutation.isPending && acceptMutation.variables) ||
    (rejectMutation.isPending && rejectMutation.variables) ||
    null;

  const handleAccept = (id: number) => {
    const inv = invitations.find((i) => i.id === id);
    acceptMutation.mutate(id, {
      onSuccess: () => {
        toast.show({
          message: `${inv?.guardianName ?? "보호자"}님을 보호자로 등록했어요`,
          variant: "success",
        });
      },
      onError: (err) => {
        const msg =
          err instanceof ApiException
            ? err.message
            : "수락에 실패했어요. 잠시 후 다시 시도해주세요";
        toast.show({ message: msg, variant: "error" });
      },
    });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate(id, {
      onSuccess: () => {
        toast.show({ message: "초대를 거절했어요", variant: "info" });
      },
      onError: (err) => {
        const msg =
          err instanceof ApiException
            ? err.message
            : "거절에 실패했어요. 잠시 후 다시 시도해주세요";
        toast.show({ message: msg, variant: "error" });
      },
    });
  };

  const isEmpty = !isLoading && invitations.length === 0;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer audience="elderly" paddingTop={0}>
        <AppHeader title="받은 초대" audience="elderly" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            isLoading || isEmpty ? styles.centerContent : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.brand.primary]}
              tintColor={Colors.brand.primary}
            />
          }
        >
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.brand.primary} />
          ) : isEmpty ? (
            <View style={styles.emptyInner}>
              <Ionicons
                name="mail-open-outline"
                size={64}
                color={Colors.text.disabled}
              />
              <AppText
                variant="bodyBold"
                audience="elderly"
                color="secondary"
                style={styles.emptyTitle}
              >
                받은 초대가 없어요
              </AppText>
              <AppText
                variant="caption"
                audience="elderly"
                color="secondary"
                style={styles.emptyDesc}
              >
                보호자가 요청을 보내면 여기에 보여요
              </AppText>
            </View>
          ) : (
            invitations.map((inv) => (
              <ReceivedInvitationCard
                key={inv.id}
                invitation={inv}
                onAccept={handleAccept}
                onReject={handleReject}
                isProcessing={processingId === inv.id}
              />
            ))
          )}
        </ScrollView>
      </ScreenContainer>
      <FloatingSosButton />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  // 로딩/빈 상태: 컨텐츠를 화면 중앙에 배치
  centerContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  // 리스트 상태: 카드들 배치
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  emptyInner: {
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: Spacing.md,
  },
  emptyDesc: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
