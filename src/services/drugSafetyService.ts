// 복약 안전 분석 (Graph RAG) API.
//
// 보안 노트:
//  - identity(주민번호), phoneNo 는 민감정보.
//  - 본 서비스는 sanitize 후 그대로 전송만 한다. 어디에도 저장하지 않는다.
//  - 호출자(화면) 역시 useState 메모리에만 보관하고 unmount 시 폐기해야 한다.

import { api } from "./api";
import type {
  CodefAuthInput,
  CodefAuthSession,
  CodefConfirmInput,
  MedicationAnalysis,
} from "../types/drugSafety";

/** 하이픈/공백 제거. */
function stripNonDigit(s: string): string {
  return s.replace(/[^\d]/g, "");
}

/** POST /api/drug-safety/auth/request */
export async function requestCodefAuth(
  input: CodefAuthInput,
): Promise<CodefAuthSession> {
  const res = await api.post<CodefAuthSession>(
    "/api/drug-safety/auth/request",
    {
      identity: stripNonDigit(input.identity),
      userName: input.userName.trim(),
      phoneNo: stripNonDigit(input.phoneNo),
    },
    { timeout: 60000 }, // 정현이형 1차 응답이 ~30초 걸려서 여유 필요
  );
  return res.data;
}

/** POST /api/drug-safety/auth/confirm */
/** POST /api/drug-safety/auth/confirm */
export async function confirmCodefAuth(
  input: CodefConfirmInput,
): Promise<MedicationAnalysis> {
  const res = await api.post<MedicationAnalysis>(
    "/api/drug-safety/auth/confirm",
    {
      identity: stripNonDigit(input.identity),
      userName: input.userName.trim(),
      phoneNo: stripNonDigit(input.phoneNo),
      jti: input.jti,
      twoWayTimestamp: input.twoWayTimestamp,
    },
    { timeout: 120000 }, // Graph RAG 응답 ~30초+, 처방 raw 포함으로 무거워져 120초로 여유
  );
  return res.data;
}

/** GET /api/drug-safety/analysis — wardId 미지정 시 본인 결과. */
export async function getMedicationAnalysis(
  wardId?: number,
): Promise<MedicationAnalysis> {
  const res = await api.get<MedicationAnalysis>("/api/drug-safety/analysis", {
    params: wardId !== undefined ? { wardId } : undefined,
  });
  return res.data;
}
/**
 * POST /api/drug-safety/analysis/refresh-request/{wardId}
 * 보호자 → 피보호자에게 처방전 분석 업데이트 요청 푸시 발사.
 * DB 캐시는 변경되지 않음 (피보호자가 직접 분석을 다시 실행해야 갱신됨).
 */
export async function requestAnalysisRefresh(wardId: number): Promise<void> {
  await api.post(`/api/drug-safety/analysis/refresh-request/${wardId}`);
}
