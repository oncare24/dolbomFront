// LLM 문진 Mock 응답.
// 백엔드 연동 시 medicalChatService.ts의 sendMessage 함수만 axios로 교체.

export const INITIAL_BOT_MESSAGE =
  "안녕하세요. 어디가 어떻게 불편하신지 말씀해 주세요.";

const MOCK_BOT_REPLIES: string[] = [
  "그러시군요. 언제부터 그러셨어요?",
  "통증은 어느 정도이신가요? 많이 아프세요?",
  "잘 알겠습니다. 가까운 병원을 찾아드릴게요. 잠시만 기다려주세요.",
];

/** 사용자 메시지 횟수에 따라 Mock 응답 반환 */
export function getMockBotReply(userMessageCount: number): {
  reply: string;
  done: boolean;
} {
  const idx = Math.min(userMessageCount - 1, MOCK_BOT_REPLIES.length - 1);
  return {
    reply: MOCK_BOT_REPLIES[idx],
    done: idx >= MOCK_BOT_REPLIES.length - 1,
  };
}
