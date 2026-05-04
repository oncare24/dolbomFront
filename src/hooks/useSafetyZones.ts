// 안전구역 react-query 훅 모음.
//
// queryKey 컨벤션: ["safetyZones", "list", protegeId] / ["safetyZones", "detail", zoneId]
// useMe와 동일한 staleTime 5분 정책 (App.tsx에서 전역 설정).

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createSafetyZone,
  deleteSafetyZone,
  getSafetyZone,
  getSafetyZones,
  updateSafetyZone,
  updateSafetyZoneNotification,
  type CreateSafetyZoneInput,
  type UpdateSafetyZoneInput,
} from "../services/safetyZoneService";
import type { SafetyZone } from "../types/safetyZone";
import { wardKeys } from "./useMyWards";
// ───────────────────────────────────────────────────────
// Query Keys (Factory)
// ───────────────────────────────────────────────────────
export const safetyZoneKeys = {
  all: ["safetyZones"] as const,
  lists: () => [...safetyZoneKeys.all, "list"] as const,
  list: (protegeId: number) => [...safetyZoneKeys.lists(), protegeId] as const,
  details: () => [...safetyZoneKeys.all, "detail"] as const,
  detail: (id: number) => [...safetyZoneKeys.details(), id] as const,
};

// ───────────────────────────────────────────────────────s
// Queries
// ───────────────────────────────────────────────────────

/** 특정 피보호자의 안전구역 목록. */
export function useSafetyZones(
  protegeId: number,
  options?: Omit<UseQueryOptions<SafetyZone[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: safetyZoneKeys.list(protegeId),
    queryFn: () => getSafetyZones(protegeId),
    ...options,
  });
}

/** 단건 조회. 화면에서 거의 안 쓰이지만(목록에서 들어가니까) 직링크 케이스 대비. */
export function useSafetyZone(id: number, enabled = true) {
  return useQuery({
    queryKey: safetyZoneKeys.detail(id),
    queryFn: () => getSafetyZone(id),
    enabled,
  });
}

// ───────────────────────────────────────────────────────
// Mutations
// ───────────────────────────────────────────────────────

/** 등록. 성공 시 해당 protegeId 목록 invalidate. */
export function useCreateSafetyZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSafetyZoneInput) => createSafetyZone(input),
    onSuccess: (zone) => {
      qc.invalidateQueries({ queryKey: safetyZoneKeys.list(zone.protegeId) });
      // ward의 status는 안전구역 유무 + 마지막 위치 보고로 결정됨 → 같이 갱신
      qc.invalidateQueries({ queryKey: wardKeys.list() });
    },
  });
}

/** 수정. 성공 시 목록 + 해당 단건 둘 다 invalidate. */
export function useUpdateSafetyZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateSafetyZoneInput }) =>
      updateSafetyZone(id, input),
    onSuccess: (zone) => {
      qc.invalidateQueries({ queryKey: safetyZoneKeys.list(zone.protegeId) });
      qc.invalidateQueries({ queryKey: safetyZoneKeys.detail(zone.id) });
      // 반경·위치가 바뀌면 안/밖 판정 결과도 바뀔 수 있음
      qc.invalidateQueries({ queryKey: wardKeys.list() });
    },
  });
}

/** 알림 토글. Optimistic Update 적용 — UX 즉각성 우선. */
export function useToggleSafetyZoneNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      updateSafetyZoneNotification(id, enabled),

    // ─ Optimistic: 응답 기다리지 않고 캐시 먼저 갱신 ─
    onMutate: async ({ id, enabled }) => {
      // 진행 중인 query 취소 (덮어쓰기 방지)
      await qc.cancelQueries({ queryKey: safetyZoneKeys.lists() });

      // 모든 list 캐시 순회하며 해당 zone만 업데이트
      const snapshots = qc.getQueriesData<SafetyZone[]>({
        queryKey: safetyZoneKeys.lists(),
      });

      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<SafetyZone[]>(
          key,
          data.map((z) =>
            z.id === id ? { ...z, notificationEnabled: enabled } : z,
          ),
        );
      });

      return { snapshots };
    },

    // ─ 실패 시 롤백 ─
    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
    },

    // ─ 성공/실패 무관하게 서버 진실로 한 번 더 동기화 ─
    onSettled: (zone) => {
      if (zone) {
        qc.invalidateQueries({ queryKey: safetyZoneKeys.list(zone.protegeId) });
      }
    },
  });
}

/** 삭제 (soft). protegeId는 mutation 호출 시 같이 받아 invalidate에 사용. */
export function useDeleteSafetyZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; protegeId: number }) =>
      deleteSafetyZone(id),
    onSuccess: (_void, { protegeId }) => {
      qc.invalidateQueries({ queryKey: safetyZoneKeys.list(protegeId) });
      // 마지막 안전구역 삭제 시 status가 unknown으로 돌아감
      qc.invalidateQueries({ queryKey: wardKeys.list() });
    },
  });
}
