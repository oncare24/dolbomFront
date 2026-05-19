// 튜토리얼 가이드 말풍선.
// 텍스트가 바뀔 때마다 자동으로 음성으로 안내 (TTS).
// 우측 상단에 다시 듣기 버튼 — 사용자가 놓쳤으면 다시 들을 수 있음.

import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../common/Text";
import { Colors, Radius, Spacing, Typography } from "../../theme";
import { speak, stop } from "../../services/tutorialSpeechService";

interface Props {
  text: string;
  /** 화면 위/아래 중 어디에 띄울지. 기본: bottom */
  position?: "top" | "bottom";
  /** 음성 안내 켜기/끄기 (테스트용). 기본 true */
  speechEnabled?: boolean;
}

export const TutorialHintBubble: React.FC<Props> = ({
  text,
  position = "bottom",
  speechEnabled = true,
}) => {
  // text가 바뀔 때마다 새로 음성 출력
  useEffect(() => {
    if (!speechEnabled) return;
    if (!text) return;
    // 잠시 지연 — 화면 전환 시 즉시 말하면 어색
    const timer = setTimeout(() => {
      speak(text);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [text, speechEnabled]);

  // 화면 이탈 시 음성 중단
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const handleReplay = () => {
    speak(text);
  };

  return (
    <View
      style={[
        styles.container,
        position === "top" ? styles.positionTop : styles.positionBottom,
      ]}
    >
      <View style={styles.bubble}>
        <View style={styles.headerRow}>
          <View style={styles.badge}>
            <AppText
              variant="caption"
              audience="elderly"
              style={styles.badgeText}
            >
              튜토리얼
            </AppText>
          </View>

          {speechEnabled && (
            <Pressable
              onPress={handleReplay}
              hitSlop={12}
              style={styles.replayBtn}
              accessibilityRole="button"
              accessibilityLabel="안내 음성 다시 듣기"
            >
              <Ionicons
                name="volume-high"
                size={22}
                color={Colors.brand.primary}
              />
            </Pressable>
          )}
        </View>

        <AppText
          variant="bodyBold"
          audience="elderly"
          color="primary"
          style={styles.text}
        >
          {text}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    alignItems: "center",
  },
  positionBottom: {
    bottom: Spacing.lg,
  },
  positionTop: {
    top: Spacing.xxl + Spacing.md,
  },
  bubble: {
    backgroundColor: Colors.brand.primaryLight,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.brand.primary,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    color: Colors.text.inverse,
    ...Typography.elderly.caption,
    fontWeight: "700" as const,
  },
  replayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface.card,
  },
  text: {
    textAlign: "center",
    lineHeight: 28,
  },
});
