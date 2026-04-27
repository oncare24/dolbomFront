// 채팅 메시지 버블. 봇=좌측/회색배경, 유저=우측/primary배경.
// 시니어 가독성: 본문 18sp(elderly body) + lineHeight 28.

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Spacing, Radius } from "../../theme";
import type { TextMessage } from "../../types/medicalChat";

interface Props {
  message: TextMessage;
}

export function ChatBubble({ message }: Props) {
  const isBot = message.role === "bot";

  return (
    <View
      style={[styles.row, isBot ? styles.rowBot : styles.rowUser]}
      accessibilityLabel={`${isBot ? "안내 메시지" : "내가 보낸 메시지"}: ${message.text}`}
    >
      {isBot && (
        <View style={styles.avatar}>
          <Ionicons name="medkit" size={20} color={Colors.brand.primary} />
        </View>
      )}

      <View
        style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}
      >
        <AppText variant="body" color={isBot ? "primary" : "inverse"}>
          {message.text}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing.md,
  },
  rowBot: {
    justifyContent: "flex-start",
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.xs,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
  },
  bubbleBot: {
    backgroundColor: Colors.surface.card,
    borderTopLeftRadius: 4, // 꼬리
  },
  bubbleUser: {
    backgroundColor: Colors.brand.primary,
    borderTopRightRadius: 4, // 꼬리
  },
});
