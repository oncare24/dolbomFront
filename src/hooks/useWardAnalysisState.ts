// 피보호자 분석 상태(복약·미활동) react-query 훅.
//
// queryKey 컨벤션: ["analysisState", wardId]  (useMyWards / useSafetyZones 패턴과 동일)
// staleTime 은 App.tsx 의 전역 5분 정책을 따라감.

import {
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { getWardAnalysisState } from "../services/analysisStateService";
import type { WardAnalysisState } from "../types/analysisState";

// ───────────────────────────────────────────────────────
// Query Keys (Factory)
// ───────────────────────────────────────────────────────
export const analysisStateKeys = {
  all: ["analysisState"] as const,
  ward: (wardId: number) => [...analysisStateKeys.all, wardId] as const,
};

// ───────────────────────────────────────────────────────
// Query
// ───────────────────────────────────────────────────────

/** 특정 피보호자의 최신 분석 상태(미활동 + 복약). */
export function useWardAnalysisState(
  wardId: number,
  options?: Omit<UseQueryOptions<WardAnalysisState>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: analysisStateKeys.ward(wardId),
    queryFn: () => getWardAnalysisState(wardId),
    ...options,
  });
}

/**
 * 모든 피보호자의 분석 상태를 강제 갱신.
 * (예: 보호자 홈 pull-to-refresh — ward 마다 별도 쿼리라 family 키를 통째로 invalidate)
 */
export function useInvalidateWardAnalysisStates() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: analysisStateKeys.all });
}
