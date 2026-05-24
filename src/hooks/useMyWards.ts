// 보호자의 내 피보호자(ward) 목록 react-query 훅.
// staleTime은 App.tsx의 전역 5분 정책 따라감.
//
// invalidate 트리거:
//   - 어르신이 초대 수락 직후 (받은 초대 화면) — 9-E onSuccess
//     ※ 같은 react-query client를 양쪽이 공유하지 않으니, 보호자 측은
//       다음 진입/refetch 시 갱신됨. 즉시 반영하려면 보호자가 화면 들어올 때 자동 refetch.
//   - 안전구역 등록/이탈 등 ward 상태가 바뀐 경우 (선택)

import type { Protege } from "../types/guardianHome";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { getMyWards, unlinkWard } from "../services/wardService";
// ───────────────────────────────────────────────────────
// Query Keys (Factory)
// ───────────────────────────────────────────────────────
export const wardKeys = {
  all: ["wards"] as const,
  list: () => [...wardKeys.all, "list"] as const,
};

// ───────────────────────────────────────────────────────
// Query
// ───────────────────────────────────────────────────────

export function useMyWards(
  options?: Omit<UseQueryOptions<Protege[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: wardKeys.list(),
    queryFn: getMyWards,
    ...options,
  });
}

/** ward 목록을 강제 갱신해야 할 때 (예: 초대 수락 직후 보호자 본인 화면 새로고침). */
export function useInvalidateMyWards() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: wardKeys.list() });
}

/** 피보호자 연결 해제. 성공 시 ward 목록 invalidate → 보호자 홈/상세에서 카드 사라짐. */
export function useUnlinkWard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (wardId: number) => unlinkWard(wardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: wardKeys.list() });
    },
  });
}
