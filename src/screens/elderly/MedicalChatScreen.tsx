// 병원 찾기 LLM 문진 채팅 화면.
// 키보드: ChatInputBar 내부의 KeyboardStickyView가 단독 처리.
// 컨테이너는 리사이즈하지 않고 입력바만 키보드 위에 sticky (카카오톡/ChatGPT 패턴).

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";

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
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "MedicalChat">;

function genMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * 사용자 현재 위치를 best-effort로 가져온다.
 * 권한 거부/실패 시 undefined → 백엔드 폴백 체인이 동작 (안전구역 등).
 */
async function tryGetCurrentLocation(): Promise<
  { latitude: number; longitude: number } | undefined
> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return undefined;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  } catch {
    return undefined;
  }
}

export default function MedicalChatScreen() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
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

  // 화면 진입 시 위치 권한을 미리 한 번 요청 (대화 중간에 갑자기 뜨는 것 방지)
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().catch(() => {});
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

    const userMsg: TextMessage = {
      id: genMessageId(),
      role: "user",
      type: "text",
      text: trimmed,
      createdAt: Date.now(),
      status: "sent",
    };

    const typingMsg: TypingMessage = {
      id: `typing-${Date.now()}`,
      role: "bot",
      type: "typing",
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setInputText("");
    setIsWaitingBot(true);

    try {
      // 적응형 문진: LLM이 첫 턴에 바로 done=true 할 수 있으므로
      // 매 턴 위치를 미리 확보해 둠 (캐시되어 부담 적음).
      // 위치 실패 시 undefined → 백엔드 폴백 체인(안전구역 등)이 동작.
      const location = await tryGetCurrentLocation();

      const res = await sendMessage(
        {
          sessionId: sessionIdRef.current,
          message: trimmed,
          history: messages
            .filter((m): m is TextMessage => m.type === "text")
            .map((m) => ({ role: m.role, text: m.text })),
        },
        location,
      );

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
        // 결과 화면으로 이동 (잠깐 봇 메시지 보여준 후)
        if (res.result) {
          setTimeout(() => {
            navigation.navigate("HospitalRecommendResult", {
              result: res.result!,
            });
          }, 1200);
        } else {
          toast.show({
            message: "결과를 받지 못했어요. 잠시 후 다시 시도해주세요.",
            variant: "error",
          });
        }
      }
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.type !== "typing"));
      toast.show({
        message:
          e?.message ?? "응답을 받지 못했어요. 잠시 후 다시 시도해주세요.",
        variant: "error",
      });
      console.error("[MedicalChat] sendMessage failed:", e);
    } finally {
      setIsWaitingBot(false);
    }
  }, [inputText, isWaitingBot, isFinished, messages, toast, navigation]);

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => {
    if (item.type === "typing") return <TypingIndicator />;
    return <ChatBubble message={item} />;
  }, []);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />

      <AppHeader title="병원 찾기" audience="elderly" />

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

      <ChatInputBar
        text={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        disabled={isWaitingBot || isFinished}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    /* ★ flexGrow:1 제거 — 메시지 적을 때 위쪽부터 쌓이도록 */
  },
});
