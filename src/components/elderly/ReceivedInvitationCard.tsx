// 받은 초대 카드 한 장. InvitationListScreen에서 사용.
// 시니어 톤: 큰 카드, padding lg, 수락/거절 두 버튼 가로배치 (Primary + Secondary).

import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { PrimaryButton, SecondaryButton } from "../common/Button";
import { Colors, Spacing, Radius, Elevation } from "../../theme";
import type { ReceivedInvitation } from "../../types/invitation";

interface Props {
  invitation: ReceivedInvitation;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  isProcessing?: boolean;
}

export function ReceivedInvitationCard({
  invitation,
  onAccept,
  onReject,
  isProcessing = false,
}: Props) {
  const handleAccept = () => {
    Alert.alert(
      "보호자 등록",
      `${invitation.guardianName}님을 보호자로 등록할까요?\n등록하면 ${invitation.guardianName}님이 어르신의 위치와 안전 상태를 볼 수 있어요.`,
      [
        { text: "취소", style: "cancel" },
        { text: "등록하기", onPress: () => onAccept(invitation.id) },
      ],
    );
  };

  const handleReject = () => {
    Alert.alert(
      "초대 거절",
      `${invitation.guardianName}님의 요청을 거절하시겠어요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "거절하기",
          style: "destructive",
          onPress: () => onReject(invitation.id),
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="person" size={28} color={Colors.brand.primary} />
        </View>
        <View style={styles.headerText}>
          <AppText variant="h3" audience="elderly" color="primary">
            {invitation.guardianName}
          </AppText>
          <AppText
            variant="caption"
            audience="elderly"
            color="secondary"
            style={styles.phone}
          >
            {invitation.guardianPhoneMasked}
          </AppText>
        </View>
      </View>

      <AppText
        variant="body"
        audience="elderly"
        color="primary"
        style={styles.message}
      >
        보호자가 되고 싶어해요.
        {invitation.relationship ? `\n관계: ${invitation.relationship}` : ""}
      </AppText>

      <View style={styles.buttonRow}>
        <View style={styles.buttonFlex}>
          <SecondaryButton
            label="거절"
            onPress={handleReject}
            disabled={isProcessing}
            audience="elderly"
            style={styles.button}
          />
        </View>
        <View style={styles.buttonFlex}>
          <PrimaryButton
            label="등록하기"
            onPress={handleAccept}
            loading={isProcessing}
            audience="elderly"
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Elevation.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  phone: {
    marginTop: 2,
  },
  message: {
    marginBottom: Spacing.lg,
    lineHeight: 28,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  buttonFlex: {
    flex: 1,
  },

  button: {
    minHeight: 72, // ← 추가
  },
});
