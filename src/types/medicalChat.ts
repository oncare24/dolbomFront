// LLM 문진 채팅 도메인 타입.
//
// 백엔드 LLM 병원추천 파이프라인:
//   - 멀티턴 대화 자체는 프론트에서 시뮬레이션 (사용자 메시지 누적)
//   - 마지막 턴에 누적 증상을 한 번에 백엔드 POST /api/hospitals/recommend로 전달
//   - 응답을 결과(result)로 받아 프론트가 다음 화면(HospitalRecommendResult)으로 전달

import type { RecommendResponse } from "./hospital";

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

export interface MedicalChatRequest {
  sessionId: string;
  message: string;
  history: { role: ChatRole; text: string }[];
}

/**
 * 봇 응답.
 *
 * - {@code reply}: 봇이 화면에 띄울 메시지 (다음 질문 또는 마무리 문구)
 * - {@code done}: true면 마지막 턴 — UI는 채팅 입력을 잠그고 결과 화면으로 이동해야 함
 * - {@code result}: done=true일 때만 채워짐. 백엔드에서 받은 진료과/병원 리스트.
 *                   다음 화면(HospitalRecommendResultScreen)으로 전달하는 데이터.
 */
export interface MedicalChatResponse {
  sessionId: string;
  reply: string;
  done?: boolean;
  result?: RecommendResponse;
}
