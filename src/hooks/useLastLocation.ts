// 피보호자(ward)의 마지막 보고 위치 조회 react-query 훅.
//
// 사용처:
//   - 안전구역 추가 화면 초기 카메라 위치 (피보호자 실위치 기반)
//   - 향후: 보호자 대시보드 지도 미리보기, 위치 갱신 폴링 등
//
// staleTime은 전역 5분(App.tsx)보다 짧게 30초로 override.
// 위치는 자주 갱신되는 데이터라 신선도 우선.
//
// 응답의 latitude/longitude는 null 가능 (한 번도 보고 안 한 피보호자) — 호출자가 fallback 처리.

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getLastLocation } from "../services/locationService";
import type { LastLocation } from "../types/location";

export const lastLocationKeys = {
  all: ["lastLocation"] as const,
  byWard: (protegeId: number) => [...lastLocationKeys.all, protegeId] as const,
};

/**
 * 특정 피보호자의 마지막 보고 위치.
 *
 * @param protegeId 피보호자 ID
 * @param enabled false면 API 호출 안 함 (조건부 호출용, 기본 true)
 */
export function useLastLocation(
  protegeId: number,
  enabled: boolean = true,
  options?: Omit<
    UseQueryOptions<LastLocation>,
    "queryKey" | "queryFn" | "enabled"
  >,
) {
  return useQuery({
    queryKey: lastLocationKeys.byWard(protegeId),
    queryFn: () => getLastLocation(protegeId),
    enabled,
    staleTime: 30 * 1000, // 30초 — 위치는 자주 변하므로 짧게
    refetchInterval: 30 * 1000, // ← 이 한 줄 추가. 30초마다 자동 갱신 시연후 제거
    ...options,
  });
}
