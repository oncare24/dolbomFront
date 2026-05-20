// 복약 안전 분석 react-query 훅.
//
// queryKey 컨벤션:
//   ["drugSafety", "analysis", "self"]
//   ["drugSafety", "analysis", "ward", wardId]
//
// - D001 (분석 이력 없음) 은 retry 즉시 중단 — 빈 상태 분기용.
// - confirm 성공 시 본인 캐시 즉시 setQueryData → 결과 화면이 카톡 인증 직후
//   네트워크 한 번 더 안 타고 그대로 렌더.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  confirmCodefAuth,
  getMedicationAnalysis,
  requestCodefAuth,
  requestAnalysisRefresh,
} from "../services/drugSafetyService";
import { ApiException } from "./../services/api";
import type {
  CodefAuthInput,
  CodefAuthSession,
  CodefConfirmInput,
  MedicationAnalysis,
} from "../types/drugSafety";

// ────────────────────────────────────────────
// Query Keys
// ────────────────────────────────────────────

export const drugSafetyKeys = {
  all: ["drugSafety"] as const,
  analysis: () => [...drugSafetyKeys.all, "analysis"] as const,
  selfAnalysis: () => [...drugSafetyKeys.analysis(), "self"] as const,
  wardAnalysis: (wardId: number) =>
    [...drugSafetyKeys.analysis(), "ward", wardId] as const,
};

// ────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────

/** 본인(피보호자) 분석 결과. */
export function useSelfMedicationAnalysis(
  options?: Omit<UseQueryOptions<MedicationAnalysis>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: drugSafetyKeys.selfAnalysis(),
    queryFn: () => getMedicationAnalysis(),
    retry: (failureCount, error) => {
      if (error instanceof ApiException && error.code === "D001") return false;
      return failureCount < 2;
    },
    ...options,
  });
}

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

/** 1차 카카오톡 간편인증 요청. 캐시 영향 없음. */
export function useRequestCodefAuth() {
  return useMutation<CodefAuthSession, ApiException, CodefAuthInput>({
    mutationFn: (input) => requestCodefAuth(input),
  });
}

/** 2차 확정 + 분석. 성공 시 본인/보호자 캐시 모두 갱신. */
export function useConfirmCodefAuth() {
  const qc = useQueryClient();
  return useMutation<MedicationAnalysis, ApiException, CodefConfirmInput>({
    mutationFn: (input) => confirmCodefAuth(input),
    onSuccess: (result) => {
      qc.setQueryData(drugSafetyKeys.selfAnalysis(), result);
      qc.invalidateQueries({ queryKey: drugSafetyKeys.analysis() });
    },
  });
}
/**
 * 보호자 → 피보호자 재분석 요청 푸시.
 * 캐시 영향 없음 (실제 갱신은 피보호자가 분석을 다시 실행할 때).
 */
export function useRequestAnalysisRefresh() {
  return useMutation<void, ApiException, number>({
    mutationFn: (wardId) => requestAnalysisRefresh(wardId),
  });
}
