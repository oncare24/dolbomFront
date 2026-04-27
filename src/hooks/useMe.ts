// 내 정보 조회 훅 (useQuery 표본).
//
// queryKey는 Factory 패턴으로 한 곳에 모음 → 무효화 시 동일 key 보장.
// userQueryKeys.all 로 invalidate하면 user 관련 모든 쿼리가 무효화됨 (prefix 매칭).

import { useQuery } from "@tanstack/react-query";
import { getMe } from "../services/userService";

export const userQueryKeys = {
  all: ["user"] as const,
  me: () => [...userQueryKeys.all, "me"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: userQueryKeys.me(),
    queryFn: getMe,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
  });
}
