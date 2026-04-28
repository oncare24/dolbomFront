// 보낸 초대 카드 (PENDING 상태). GuardianHome '대기 중' 섹션에 노출.

import React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Spacing, Radius, Elevation } from "../../theme";
import { haptic } from "../../utils/haptics";
import type { SentInvitation } from "../../types/invitation";

interface Props {
  invitation: SentInvitation;
  onCancel: (id: number) => void;
  isCancelling?: boolean;
}

export function SentInvitationCard({
  invitation,
  onCancel,
  isCancelling = false,
}: Props) {
  const handleCancel = () => {
    haptic.light();
    Alert.alert(
      "초대 취소",
      `${invitation.wardName}님에게 보낸 초대를 취소할까요?`,
      [
        { text: "유지", style: "cancel" },
        {
          text: "취소하기",
          style: "destructive",
          onPress: () => onCancel(invitation.id),
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons
          name="hourglass-outline"
          size={24}
          color={Colors.brand.primary}
        />
      </View>

      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <AppText variant="bodyBold" audience="guardian">
            {invitation.wardName}
          </AppText>
          {invitation.relationship ? (
            <AppText
              variant="caption"
              audience="guardian"
              color="secondary"
              style={styles.relation}
            >
              · {invitation.relationship}
            </AppText>
          ) : null}
        </View>
        <AppText
          variant="caption"
          audience="guardian"
          color="secondary"
          style={styles.subtitle}
        >
          {invitation.wardPhoneMasked} · 수락 대기 중
        </AppText>
      </View>

      <Pressable
        onPress={handleCancel}
        disabled={isCancelling}
        hitSlop={8}
        style={styles.cancelBtn}
        accessibilityRole="button"
        accessibilityLabel="초대 취소"
      >
        <AppText variant="caption" color="link">
          {isCancelling ? "취소 중..." : "취소"}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.background,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 72,
    ...Elevation.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  relation: {
    marginLeft: 4,
  },
  subtitle: {
    marginTop: 2,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
});
