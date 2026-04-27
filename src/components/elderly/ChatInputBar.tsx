// 채팅 하단 입력 영역.
// 메신저 앱 표준 구조: 둥근 입력창 한 덩어리 + 내부에 마이크/전송 아이콘 박힘.
// KeyboardStickyView로 키보드와 자연스럽게 함께 움직임 (카카오톡/왓츠앱 패턴).

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
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Spacing, Radius, Typography } from "../../theme";
import { haptic } from "../../utils/haptics";
import { sttService, useSttRecognition } from "../../services/sttService";

interface Props {
  text: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInputBar({ text, onChangeText, onSend, disabled }: Props) {
  const pulse = useSharedValue(1);
  const insets = useSafeAreaInsets();

  const { isListening } = useSttRecognition({
    onResult: (recognized) => onChangeText(recognized),
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

  useEffect(() => {
    if (isListening) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 500, easing: Easing.out(Easing.quad) }),
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
  const showSendButton = text.trim().length > 0; // 왓츠앱 패턴: 텍스트 있을 때만 전송 버튼

  const stickyOffset = { closed: 0, opened: insets.bottom };
  return (
    <KeyboardStickyView offset={stickyOffset} style={styles.stickyWrap}>
      <View
        style={[
          styles.container,
          { paddingBottom: Spacing.sm + insets.bottom },
        ]}
      >
        <View
          style={[styles.inputWrap, isListening && styles.inputWrapListening]}
        >
          <Animated.View style={animatedMicStyle}>
            <Pressable
              onPress={handleMicPress}
              disabled={disabled}
              hitSlop={12}
              android_ripple={{
                color: Colors.brand.primaryLight,
                borderless: true,
                radius: 24,
              }}
              accessibilityRole="button"
              accessibilityLabel={
                isListening ? "음성 인식 중지" : "음성으로 말하기"
              }
              accessibilityHint="누르고 말씀하시면 글로 옮겨드려요"
              style={styles.micIconButton}
            >
              <Ionicons
                name={isListening ? "stop-circle" : "mic"}
                size={28}
                color={
                  isListening ? Colors.semantic.danger : Colors.brand.primary
                }
              />
            </Pressable>
          </Animated.View>

          <TextInput
            value={text}
            onChangeText={onChangeText}
            placeholder={
              isListening ? "듣고 있어요..." : "말씀하거나 글로 입력하세요"
            }
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

          {showSendButton && (
            <Pressable
              onPress={handleSendPress}
              disabled={!canSend}
              hitSlop={12}
              android_ripple={{
                color: Colors.brand.primaryDark,
                borderless: true,
                radius: 24,
              }}
              accessibilityRole="button"
              accessibilityLabel="메시지 보내기"
              style={[
                styles.sendIconButton,
                !canSend && styles.sendIconButtonDisabled,
              ]}
            >
              <Ionicons name="arrow-up" size={22} color={Colors.text.inverse} />
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardStickyView>
  );
}

const styles = StyleSheet.create({
  stickyWrap: {
    backgroundColor: Colors.surface.background,
  },
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface.background,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.divider,
  },
  // ── 입력창 한 덩어리 ──
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    maxHeight: 140,
    borderRadius: Radius.full, // 시니어 친근한 둥근 형태
    borderWidth: 1.5,
    borderColor: Colors.surface.divider,
    backgroundColor: Colors.surface.card,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    gap: Spacing.xs,
  },
  inputWrapListening: {
    borderColor: Colors.semantic.danger,
    borderWidth: 2,
  },
  // ── 좌측 마이크 ──
  micIconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  // ── 텍스트 입력 ──
  input: {
    flex: 1,
    ...Typography.elderly.body,
    color: Colors.text.primary,
    padding: 0,
    paddingTop: 8, // multiline 때 텍스트 위쪽 여백
    paddingBottom: 8,
    textAlignVertical: "center",
  },
  // ── 우측 전송 ──
  sendIconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIconButtonDisabled: {
    opacity: 0.4,
  },
});
