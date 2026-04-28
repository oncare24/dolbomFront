// 병원 찾기 LLM 문진 + 백엔드 호출.
//
// 흐름:
//   - 1, 2번째 사용자 메시지: 봇이 다음 질문을 던지는 척 (프론트 시뮬레이션. 백엔드 호출 없음)
//   - 3번째 사용자 메시지: 누적된 증상을 한 문장으로 합쳐서 POST /api/hospitals/recommend 호출
//                         → 응답을 result로 채워 done=true 반환
//
// 이 방식의 이유:
//   - 백엔드는 한 번 호출에 LLM이 진료과/응급도까지 한 번에 분류
//   - 멀티턴 대화 자체는 사용자 경험을 위해 가짜로 만든 단계 (천천히 묻고 답하는 느낌)
//   - 친구가 만든 채팅 UI 흐름을 그대로 살리면서 백엔드 API 한 번 호출로 통합

import { api } from "./api";
import type {
  ChatRole,
  MedicalChatRequest,
  MedicalChatResponse,
} from "../types/medicalChat";
import type { RecommendResponse } from "../types/hospital";

/** 마지막 턴 직전까지의 안내 멘트 (백엔드 호출 없이 사용자 입력 유도). */
const FOLLOWUP_REPLIES: string[] = [
  "그러시군요. 언제부터 그런 증상이 있으셨어요?",
  "통증은 어느 정도이신가요? 함께 다른 증상이 있다면 알려주세요.",
];

/** 마지막 턴(병원 추천 호출 직전)에 표시할 안내 멘트. */
const ANALYZING_REPLY = "잘 알겠습니다. 가까운 병원을 찾아드리고 있어요. 잠시만 기다려주세요.";

/** 새 채팅 세션 ID 발급. 현재는 클라이언트 생성, 향후 백엔드 발급으로 이전 가능. */
export function createSessionId(): string {
  return `mc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 사용자가 입력한 모든 user 메시지를 한 문장으로 합친다.
 * 백엔드 /api/hospitals/recommend의 symptoms 파라미터로 사용.
 *
 * 예:
 *   사용자: "배가 아파요"
 *   사용자: "어제 저녁부터요"
 *   사용자: "오른쪽 아래쪽이 콕콕거려요"
 *   → "배가 아파요. 어제 저녁부터요. 오른쪽 아래쪽이 콕콕거려요."
 */
function buildCombinedSymptoms(
  history: { role: ChatRole; text: string }[],
  currentMessage: string,
): string {
  const userMessages = history
    .filter((m) => m.role === "user")
    .map((m) => m.text.trim())
    .filter(Boolean);
  userMessages.push(currentMessage.trim());
  return userMessages.join(". ");
}

/**
 * 사용자 메시지 → 봇 응답.
 *
 * 마지막 턴(누적된 user 메시지가 3개째)에서 백엔드 호출.
 * 이전 턴은 가벼운 후속 질문으로 시뮬레이션.
 */
export async function sendMessage(
  req: MedicalChatRequest,
  options?: {
    /** 사용자 현재 GPS 위치 (있으면 백엔드에 전달) */
    latitude?: number;
    longitude?: number;
    /** 검색 반경 (미터). 기본 5000 */
    radius?: number;
  },
): Promise<MedicalChatResponse> {
  const userMessageCountIncludingCurrent =
    req.history.filter((m) => m.role === "user").length + 1;

  // 마지막 턴 (3번째) → 백엔드 호출
  const isFinalTurn =
    userMessageCountIncludingCurrent >= FOLLOWUP_REPLIES.length + 1;

  if (!isFinalTurn) {
    // 후속 질문 시뮬레이션: 1번째→인덱스 0, 2번째→인덱스 1
    await sleep(800); // 봇이 생각하는 척 잠깐 대기
    const idx = userMessageCountIncludingCurrent - 1;
    return {
      sessionId: req.sessionId,
      reply: FOLLOWUP_REPLIES[idx],
      done: false,
    };
  }

  // 마지막 턴: 백엔드 호출
  const symptoms = buildCombinedSymptoms(req.history, req.message);

  try {
    const res = await api.post<RecommendResponse>("/api/hospitals/recommend", {
      symptoms,
      latitude: options?.latitude,
      longitude: options?.longitude,
      radius: options?.radius,
    });

    // res.data가 RecommendResponse (api.ts 인터셉터가 ApiResponse unwrap 처리)
    const result = res.data as unknown as RecommendResponse;

    return {
      sessionId: req.sessionId,
      reply: ANALYZING_REPLY,
      done: true,
      result,
    };
  } catch (e) {
    // ApiException은 api.ts 인터셉터가 던짐. 화면에서 toast로 표시됨.
    // 여기서는 그대로 throw해서 화면이 catch하도록.
    throw e;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
