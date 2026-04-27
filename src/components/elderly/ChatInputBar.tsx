// 채팅 하단 입력 영역.
// 좌측: 마이크 버튼 (라벨 "말하기" — 시니어가 음성임을 한눈에 인식)
// 중앙: 텍스트 입력칸
// 우측: 전송 버튼
//
// 녹음 중: 마이크 빨간색 + 펄싱 + 라벨 "듣는 중..." + 입력칸 disable + 인식 텍스트 실시간 표시
// final 결과 → 입력칸에 채움 → 사용자가 검토 후 전송 누름 (자동 전송 안 함, 시니어 안전 우선)

import React, { useEffect } from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { AppText } from "../common/Text";
import { Colors, Spacing, Radius, Touch, Typography } from "../../theme";
import { haptic } from "../../utils/haptics";
import { sttService, useSttRecognition } from "../../services/sttService";

const AnimatedView = Animated.createAnimatedComponent(View);

interface Props {
  text: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean; // 봇 응답 대기 중 등
}

export function ChatInputBar({ text, onChangeText, onSend, disabled }: Props) {
  const pulse = useSharedValue(1);

  // STT 결과 → 입력칸에 실시간 반영 (interim 포함, 사용자가 검토 후 전송)
  const { isListening } = useSttRecognition({
    onResult: (recognized, _isFinal) => {
      onChangeText(recognized);
    },
    onError: (code, msg) => {
      console.warn("[STT] error:", code, msg);
      if (code === "not-allowed" || code === "permission-denied") {
        Alert.alert(
          "권한이 필요해요",
          "음성 인식을 위해 마이크 권한을 허용해주세요.",
        );
      }
    },
  });

  // 녹음 중 마이크 버튼 펄싱
  useEffect(() => {
    if (isListening) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 500, easing: Easing.in(Easing.quad) }),
        ),
        -1,
      );
    } else {
      pulse.value = withSpring(1, { damping: 14, stiffness: 200 });
    }
  }, [isListening]);

  const animatedMicStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleMicPress = async () => {
    haptic.medium();
    if (isListening) {
      sttService.stop();
      return;
    }

    const granted = await sttService.requestPermission();
    if (!granted) {
      Alert.alert(
        "권한이 필요해요",
        "음성 인식을 위해 마이크 권한을 허용해주세요.",
      );
      return;
    }
    sttService.start("ko-KR");
  };

  const handleSendPress = () => {
    if (!text.trim() || disabled) return;
    haptic.light();
    onSend();
  };

  const canSend = text.trim().length > 0 && !disabled && !isListening;

  return (
    <View style={styles.container}>
      {/* ── 마이크 버튼 + 라벨 ── */}
      <View style={styles.micWrap}>
        <AnimatedView style={animatedMicStyle}>
          <Pressable
            onPress={handleMicPress}
            disabled={disabled}
            android_ripple={{
              color: Colors.brand.primaryDark,
              borderless: true,
              radius: 32,
            }}
            accessibilityRole="button"
            accessibilityLabel={
              isListening ? "음성 인식 중지" : "음성으로 말하기"
            }
            accessibilityHint="누르고 말씀하시면 글로 옮겨드려요"
            style={[
              styles.micButton,
              isListening && styles.micButtonListening,
              disabled && styles.micButtonDisabled,
            ]}
          >
            <Ionicons
              name={isListening ? "stop" : "mic"}
              size={28}
              color={Colors.text.inverse}
            />
          </Pressable>
        </AnimatedView>
        <AppText
          variant="caption"
          color={isListening ? "danger" : "secondary"}
          style={styles.micLabel}
          numberOfLines={1}
          maxScale={1.2}
        >
          {isListening ? "듣는 중..." : "말하기"}
        </AppText>
      </View>

      {/* ── 입력칸 ── */}
      <View
        style={[styles.inputWrap, isListening && styles.inputWrapListening]}
      >
        <TextInput
          value={text}
          onChangeText={onChangeText}
          placeholder={isListening ? "듣고 있어요..." : "말씀하거나 입력하세요"}
          placeholderTextColor={Colors.text.disabled}
          editable={!disabled && !isListening}
          multiline
          maxLength={500}
          style={styles.input}
          allowFontScaling
          maxFontSizeMultiplier={1.4}
          underlineColorAndroid="transparent"
          selectionColor={Colors.brand.primary}
        />
      </View>

      {/* ── 전송 버튼 ── */}
      <Pressable
        onPress={handleSendPress}
        disabled={!canSend}
        android_ripple={{
          color: Colors.brand.primaryDark,
          borderless: true,
          radius: 28,
        }}
        accessibilityRole="button"
        accessibilityLabel="메시지 보내기"
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
      >
        <Ionicons name="arrow-up" size={26} color={Colors.text.inverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface.background,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.divider,
    gap: Spacing.xs,
  },
  // ── 마이크 ──
  micWrap: {
    alignItems: "center",
    paddingBottom: 4,
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonListening: {
    backgroundColor: Colors.semantic.danger,
  },
  micButtonDisabled: {
    opacity: 0.4,
  },
  micLabel: {
    marginTop: 2,
    fontWeight: "600",
  },
  // ── 입력칸 ──
  inputWrap: {
    flex: 1,
    minHeight: 56,
    maxHeight: 120,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.surface.divider,
    backgroundColor: Colors.surface.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    justifyContent: "center",
  },
  inputWrapListening: {
    borderColor: Colors.semantic.danger,
    borderWidth: 2,
  },
  input: {
    ...Typography.elderly.body,
    color: Colors.text.primary,
    padding: 0,
    textAlignVertical: "center",
  },
  // ── 전송 ──
  sendButton: {
    width: Touch.comfortable,
    height: Touch.comfortable,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
});
