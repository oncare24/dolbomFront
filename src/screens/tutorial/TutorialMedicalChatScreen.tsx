// [튜토리얼] LLM 문진 채팅 mock.
// 실제 백엔드 호출 없이 정해진 3턴 시나리오로 진행.
// 기존 ChatInputBar 그대로 사용 — 키보드 입력 + 마이크 음성 입력 모두 동작.
// 매칭: 키워드 부분 일치. 안 맞으면 봇이 부드럽게 다시 안내.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppHeader } from "../../components/common/Header";
import { ChatBubble } from "../../components/elderly/ChatBubble";
import { ChatInputBar } from "../../components/elderly/ChatInputBar";
import { TypingIndicator } from "../../components/elderly/TypingIndicator";
import { TutorialHintBubble } from "../../components/tutorial/TutorialHintBubble";

import { Colors, Spacing } from "../../theme";
import type {
  ChatMessage,
  TextMessage,
  TypingMessage,
} from "../../types/medicalChat";
import type { RootStackParamList } from "../../types/navigation";
import {
  matchesTurn,
  TUTORIAL_CHAT_TURNS,
  TUTORIAL_HINTS,
  TUTORIAL_HOSPITAL_RESULT,
  TUTORIAL_INITIAL_BOT_MESSAGE,
} from "../../constants/tutorialMocks";

type Nav = NativeStackNavigationProp<RootStackParamList, "TutorialMedicalChat">;

const BOT_TYPING_DELAY = 1200;
const NAVIGATE_DELAY = 1500;

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function TutorialMedicalChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  /** 현재 사용자 입력을 매칭할 턴 인덱스. TUTORIAL_CHAT_TURNS.length 도달 시 종료. */
  const [turnIndex, setTurnIndex] = useState(0);
  const [isWaitingBot, setIsWaitingBot] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // 진입 시 봇 첫 인사
  useEffect(() => {
    const initial: TextMessage = {
      id: genId(),
      role: "bot",
      type: "text",
      text: TUTORIAL_INITIAL_BOT_MESSAGE,
      createdAt: Date.now(),
    };
    setMessages([initial]);
  }, []);

  // 메시지 추가될 때마다 하단 스크롤
  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const appendUserMessage = useCallback((text: string) => {
    const msg: TextMessage = {
      id: genId(),
      role: "user",
      type: "text",
      text,
      createdAt: Date.now(),
      status: "sent",
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const appendTyping = useCallback(() => {
    const t: TypingMessage = {
      id: `typing-${Date.now()}`,
      role: "bot",
      type: "typing",
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, t]);
  }, []);

  const replaceTypingWithBotMessage = useCallback((text: string) => {
    const msg: TextMessage = {
      id: genId(),
      role: "bot",
      type: "text",
      text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev.filter((m) => m.type !== "typing"), msg]);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || isWaitingBot || isFinished) return;

    const currentTurn = TUTORIAL_CHAT_TURNS[turnIndex];
    if (!currentTurn) return;

    // 사용자 메시지 표시 + 입력 비우기
    appendUserMessage(trimmed);
    setInputText("");
    appendTyping();
    setIsWaitingBot(true);

    setTimeout(() => {
      const matched = matchesTurn(trimmed, currentTurn);

      if (!matched) {
        // 매칭 실패 — 재시도 안내. 턴 진행 안 됨.
        replaceTypingWithBotMessage(currentTurn.retryReply);
        setIsWaitingBot(false);
        return;
      }

      // 매칭 성공 — 봇 응답 + 다음 턴으로
      replaceTypingWithBotMessage(currentTurn.botReply);
      setIsWaitingBot(false);
      setTurnIndex((idx) => idx + 1);

      // 마지막 턴이면 종료 + 자동 이동
      if (currentTurn.isFinal) {
        setIsFinished(true);
        setTimeout(() => {
          navigation.navigate("TutorialHospitalResult", {
            result: TUTORIAL_HOSPITAL_RESULT,
          });
        }, NAVIGATE_DELAY);
      }
    }, BOT_TYPING_DELAY);
  }, [
    inputText,
    isWaitingBot,
    isFinished,
    turnIndex,
    navigation,
    appendUserMessage,
    appendTyping,
    replaceTypingWithBotMessage,
  ]);

  // 현재 hint 텍스트 결정
  const hintText = isFinished
    ? TUTORIAL_HINTS.chat_final
    : (() => {
        const turn = TUTORIAL_CHAT_TURNS[turnIndex];
        if (!turn) return TUTORIAL_HINTS.chat_final;
        // 예시 문구를 hint에 포함 — "예: ‘허리가 아파요’"
        const exampleText = turn.examples[0]
          ? `예: ‘${turn.examples[0]}’`
          : "";
        return `${TUTORIAL_HINTS.chat_typing}\n${exampleText}`.trim();
      })();

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

      <View style={{ paddingTop: insets.top }}>
        <AppHeader title="병원 찾기" audience="elderly" />
      </View>

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

      {/* HintBubble을 입력바 위에 띄움 */}
      <View style={styles.hintWrap} pointerEvents="box-none">
        <TutorialHintBubble text={hintText} />
      </View>

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
    paddingTop: Spacing.sm,
    paddingBottom: 180, // hint + 입력바 가리지 않도록 여유
  },
  // hint를 입력바 바로 위에 띄우기 위해 absolute positioning
  hintWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 100, // ChatInputBar 위쪽
  },
});
