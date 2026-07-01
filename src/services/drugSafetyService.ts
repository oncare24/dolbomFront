// 복약 안전 분석 (Graph RAG) API (보호자 조회/재요청).

import { api } from "./api";
import type { MedicationAnalysis } from "../types/drugSafety";

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
