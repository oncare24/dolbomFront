// 병원 찾기 LLM 문진 채팅 화면.
// 메시지 흐름: 봇 첫 인사 → 사용자 입력 → 봇 응답(1.5초 지연) 반복 → 종료 시 done 플래그.
// 자동 스크롤: 새 메시지 도착 시 하단으로.

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "../../components/common/Header";
import { ChatBubble } from "../../components/elderly/ChatBubble";
import { TypingIndicator } from "../../components/elderly/TypingIndicator";
import { ChatInputBar } from "../../components/elderly/ChatInputBar";
import { useToast } from "../../components/common/Toast";

import { Colors, Spacing } from "../../theme";
import {
  createSessionId,
  sendMessage,
} from "../../services/medicalChatService";
import { INITIAL_BOT_MESSAGE } from "../../mocks/medicalChatMock";
import type {
  ChatMessage,
  TextMessage,
  TypingMessage,
} from "../../types/medicalChat";

// ── 메시지 ID 생성 ──
function genMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function MedicalChatScreen() {
  const navigation = useNavigation();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const sessionIdRef = useRef<string>(createSessionId());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isWaitingBot, setIsWaitingBot] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // 진입 시 봇 첫 인사
  useEffect(() => {
    const initial: TextMessage = {
      id: genMessageId(),
      role: "bot",
      type: "text",
      text: INITIAL_BOT_MESSAGE,
      createdAt: Date.now(),
    };
    setMessages([initial]);
  }, []);

  // 메시지 추가될 때마다 하단으로 스크롤
  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isWaitingBot || isFinished) return;

    // ── 1. 사용자 메시지 즉시 표시 ──
    const userMsg: TextMessage = {
      id: genMessageId(),
      role: "user",
      type: "text",
      text: trimmed,
      createdAt: Date.now(),
      status: "sent",
    };

    // ── 2. 타이핑 인디케이터 추가 ──
    const typingMsg: TypingMessage = {
      id: `typing-${Date.now()}`,
      role: "bot",
      type: "typing",
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setInputText("");
    setIsWaitingBot(true);

    // ── 3. 백엔드 호출 ──
    try {
      // 백엔드에 보낼 history는 현재 messages에 사용자 메시지 더한 형태 (typing 제외)
      const history = [...messages, userMsg]
        .filter((m): m is TextMessage => m.type === "text")
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await sendMessage({
        sessionId: sessionIdRef.current,
        message: trimmed,
        history,
      });

      // ── 4. 타이핑 제거 + 봇 메시지 추가 ──
      const botMsg: TextMessage = {
        id: genMessageId(),
        role: "bot",
        type: "text",
        text: res.reply,
        createdAt: Date.now(),
      };

      setMessages((prev) => [
        ...prev.filter((m) => m.type !== "typing"),
        botMsg,
      ]);

      if (res.done) {
        setIsFinished(true);
        // 향후 4-3c: 여기서 병원 카드 메시지를 추가로 푸시
      }
    } catch (e: any) {
      // 타이핑 제거 + 토스트
      setMessages((prev) => prev.filter((m) => m.type !== "typing"));
      toast.show({
        message: "응답을 받지 못했어요. 잠시 후 다시 시도해주세요.",
        variant: "error",
      });
      console.error("[MedicalChat] sendMessage failed:", e);
    } finally {
      setIsWaitingBot(false);
    }
  }, [inputText, isWaitingBot, isFinished, messages, toast]);

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => {
    if (item.type === "typing") return <TypingIndicator />;
    return <ChatBubble message={item} />;
  }, []);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <AppHeader title="병원 찾기" audience="elderly" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View style={{ paddingBottom: insets.bottom }}>
          <ChatInputBar
            text={inputText}
            onChangeText={setInputText}
            onSend={handleSend}
            disabled={isWaitingBot || isFinished}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    flexGrow: 1,
  },
});
