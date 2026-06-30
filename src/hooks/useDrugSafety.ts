// 복약 안전 분석 react-query 훅 (보호자 시점).
//
// queryKey 컨벤션:
//   ["drugSafety", "analysis", "ward", wardId]
//
// - D001 (분석 이력 없음) 은 retry 즉시 중단 — 빈 상태 분기용.

import {
  useMutation,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getMedicationAnalysis,
  requestAnalysisRefresh,
} from "../services/drugSafetyService";
import { ApiException } from "./../services/api";
import type { MedicationAnalysis } from "../types/drugSafety";

// ────────────────────────────────────────────
// Query Keys
// ────────────────────────────────────────────

export const drugSafetyKeys = {
  all: ["drugSafety"] as const,
  analysis: () => [...drugSafetyKeys.all, "analysis"] as const,
  wardAnalysis: (wardId: number) =>
    [...drugSafetyKeys.analysis(), "ward", wardId] as const,
};

// ────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────

/** 보호자 → 특정 피보호자(wardId) 분석 결과. */
export function useWardMedicationAnalysis(
  wardId: number,
  options?: Omit<UseQueryOptions<MedicationAnalysis>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: drugSafetyKeys.wardAnalysis(wardId),
    queryFn: () => getMedicationAnalysis(wardId),
    retry: (failureCount, error) => {
      if (error instanceof ApiException && error.code === "D001") return false;
      return failureCount < 2;
    },
    ...options,
  });
}

// ────────────────────────────────────────────
// Mutations
// ────────────────────────────────────────────

/**
 * 보호자 → 피보호자 재분석 요청 푸시.
 * 캐시 영향 없음 (실제 갱신은 피보호자가 분석을 다시 실행할 때).
 */
export function useRequestAnalysisRefresh() {
  return useMutation<void, ApiException, number>({
    mutationFn: (wardId) => requestAnalysisRefresh(wardId),
  });
}
