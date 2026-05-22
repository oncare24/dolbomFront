// 어르신의 내 보호자 목록 react-query 훅.
//
// 용도:
//   - 위치 추적 시작 전에 보호자 매핑 존재 여부 확인 (length > 0)
//   - 초대 수락 직후 invalidate 호출로 즉시 재조회 → 위치 추적 자동 ON 트리거

import { useQuery } from "@tanstack/react-query";
import {
  getMyGuardians,
  type MyGuardian,
} from "../services/elderGuardianService";

export const myGuardiansKeys = {
  all: ["my-guardians"] as const,
};

export function useMyGuardians(enabled: boolean = true) {
  return useQuery<MyGuardian[]>({
    queryKey: myGuardiansKeys.all,
    queryFn: getMyGuardians,
    enabled,
    staleTime: 30 * 1000, // 30초 — 너무 자주 부르지 않음
  });
}
