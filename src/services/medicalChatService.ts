// 병원 찾기 LLM 멀티턴 문진 채팅.
//
// 흐름:
//   매 사용자 입력마다 POST /api/medical-chat/turn 호출
//   → 백엔드 LLM이 두 가지 모드 중 하나로 응답:
//     A) done=false: 후속 질문 (또는 무의미 입력 재요청 멘트)
//     B) done=true:  진료과 분석 완료 + 병원 리스트 (result 채워짐)
//
// 이전 버전과 차이:
//   - 이전: 1, 2턴은 프론트에서 가짜 응답, 3턴에 단발성 /api/hospitals/recommend 호출
//   - 현재: 매 턴 백엔드 LLM 호출, LLM이 동적으로 후속 질문 생성 + 무의미 입력 거름망
//
// 화면(MedicalChatScreen.tsx)은 sendMessage() 시그니처를 그대로 호출하므로 변경 없음.
// 시그니처 호환을 유지하기 위해 입출력 타입은 기존 medicalChat.ts 그대로.

import { api } from "./api";
import type {
  ChatRole,
  MedicalChatRequest,
  MedicalChatResponse,
} from "../types/medicalChat";
import type { RecommendResponse } from "../types/hospital";

/** 새 채팅 세션 ID 발급. 백엔드는 stateless이므로 클라이언트가 생성. */
export function createSessionId(): string {
  return `mc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── 백엔드 API 통신 타입 ──

/** 백엔드 /api/medical-chat/turn 요청 body. */
interface ChatTurnApiRequest {
  sessionId: string;
  message: string;
  history: { role: ChatRole; text: string }[];
  latitude?: number;
  longitude?: number;
  radius?: number;
}

/** 백엔드 /api/medical-chat/turn 응답 body (ApiResponse 인터셉터 unwrap 후). */
interface ChatTurnApiResponse {
  sessionId: string;
  done: boolean;
  reply: string;
  result: RecommendResponse | null;
}

/**
 * 사용자 메시지 → 봇 응답.
 *
 * 매 턴 백엔드를 호출. LLM이 후속 질문을 생성하거나(done=false) 분석 완료(done=true).
 *
 * @param req      sessionId, 현재 메시지, 이전 history
 * @param options  현재 GPS 위치 / 반경 (없으면 백엔드 폴백 체인 동작)
 */
export async function sendMessage(
  req: MedicalChatRequest,
  options?: {
    latitude?: number;
    longitude?: number;
    radius?: number;
  },
): Promise<MedicalChatResponse> {
  const body: ChatTurnApiRequest = {
    sessionId: req.sessionId,
    message: req.message.trim(),
    history: req.history.map((m) => ({ role: m.role, text: m.text })),
    latitude: options?.latitude,
    longitude: options?.longitude,
    radius: options?.radius,
  };

  try {
    const res = await api.post<ChatTurnApiResponse>(
      "/api/medical-chat/turn",
      body,
    );

    // res.data가 ChatTurnApiResponse (api.ts 인터셉터가 ApiResponse unwrap 처리)
    const data = res.data as unknown as ChatTurnApiResponse;

    if (data.done && data.result) {
      // 분석 완료 - 결과 화면으로 이동할 데이터 포함
      return {
        sessionId: data.sessionId,
        reply: data.reply,
        done: true,
        result: data.result,
      };
    }

    // 후속 질문 - 다음 사용자 입력 대기
    return {
      sessionId: data.sessionId,
      reply: data.reply,
      done: false,
    };
  } catch (e) {
    // ApiException은 api.ts 인터셉터가 던짐. 화면에서 toast로 표시됨.
    throw e;
  }
}
