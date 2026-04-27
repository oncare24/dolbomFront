// LLM 문진 채팅 도메인 타입.
// 메시지를 union 구조로 두는 이유: 향후 병원카드/빠른답변칩 메시지 타입 추가 가능.

export type ChatRole = "bot" | "user";
export type ChatMessageStatus = "sending" | "sent" | "failed";

interface BaseMessage {
  id: string;
  role: ChatRole;
  createdAt: number;
}

export interface TextMessage extends BaseMessage {
  type: "text";
  text: string;
  status?: ChatMessageStatus;
}

// 봇이 응답 준비 중일 때 표시되는 점 3개 인디케이터
export interface TypingMessage extends BaseMessage {
  type: "typing";
  role: "bot";
}

export type ChatMessage = TextMessage | TypingMessage;

// ── 백엔드 호출 ──
// Spring Boot의 LLM 병원추천 파이프라인(gpt-4o-mini → 진료과 검증 → 폴백 → 국립중앙의료원 API)
// 의 입구. 프론트는 메시지/이력만 보내고 응답을 받음.

export interface MedicalChatRequest {
  sessionId: string;
  message: string;
  history: { role: ChatRole; text: string }[];
}

export interface MedicalChatResponse {
  sessionId: string;
  reply: string;
  // 향후: 병원카드 / 추천 진료과 / 종료 신호 등 추가
  done?: boolean;
}
