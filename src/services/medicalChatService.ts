// 병원 찾기 LLM 문진 백엔드 호출 (Mock).
// 실제 연동 시: axios.post('/api/medical-chat', body) 으로 교체.
// 백엔드 파이프라인: gpt-4o-mini → 진료과 화이트리스트 검증 → 폴백 → 국립중앙의료원 API → Haversine 스코어링.

import type {
  MedicalChatRequest,
  MedicalChatResponse,
} from "../types/medicalChat";
import { getMockBotReply } from "../mocks/medicalChatMock";

/** 새 채팅 세션 ID 발급 (Mock). 실제로는 백엔드가 발급. */
export function createSessionId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 사용자 메시지 → LLM 응답.
 *
 * 백엔드 연동 시:
 *   const res = await axios.post<MedicalChatResponse>(
 *     '/api/medical-chat/message',
 *     req,
 *     { headers: { Authorization: `Bearer ${accessToken}` } },
 *   );
 *   return res.data;
 */
export async function sendMessage(
  req: MedicalChatRequest,
): Promise<MedicalChatResponse> {
  // 네트워크 + LLM 추론 지연 흉내 (1.5초)
  await new Promise((r) => setTimeout(r, 1500));

  const userMessageCount = req.history.filter((m) => m.role === "user").length;
  const { reply, done } = getMockBotReply(userMessageCount);

  return {
    sessionId: req.sessionId,
    reply,
    done,
  };
}
