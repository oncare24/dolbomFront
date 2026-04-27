// 로그아웃 훅 (useMutation 표본).
//
// useQuery vs useMutation 차이:
//   - useQuery: 화면 진입 시 자동 호출 (조회용)
//   - useMutation: 사용자 액션(버튼 클릭 등)에 따라 명시적으로 .mutate() 실행 (변경용)
//
// onSuccess / onError에서 side-effect(스토어 업데이트, 캐시 비우기 등) 처리.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout as logoutApi } from "../services/authService";
import { useAuthStore } from "../stores/authStore";

export function useLogout() {
  const queryClient = useQueryClient();
  const storeLogout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: logoutApi,
    // 성공 시 클라이언트 정리
    onSuccess: () => {
      storeLogout(); // 1) Zustand에서 인증 상태 + 토큰 삭제
      queryClient.clear(); // 2) React Query 캐시 전체 비우기 (다른 유저 데이터 잔존 방지)
    },
    // 서버 호출 실패해도 클라이언트 상태는 정리해야 함
    // (이미 만료된 토큰으로 logout 호출 시 401 떨어질 수 있음)
    onError: () => {
      storeLogout();
      queryClient.clear();
    },
  });
}
