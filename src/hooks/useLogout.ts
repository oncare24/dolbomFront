// 로그아웃 훅 (useMutation 표본).
//
// useQuery vs useMutation 차이:
//   - useQuery: 화면 진입 시 자동 호출 (조회용)
//   - useMutation: 사용자 액션(버튼 클릭 등)에 따라 명시적으로 .mutate() 실행 (변경용)
//
// onSuccess / onError에서 side-effect(스토어 업데이트, 캐시 비우기 등) 처리.
//
// 추가(2026-04-28): 백그라운드 위치 추적 정지.
//   서버 logout 호출이 성공하든 실패하든(401 등) 클라이언트 정리는 무조건 수행.
//   추적 정지를 빼먹으면 로그아웃 후에도 OS 태스크가 살아남아 다음 사용자 위치를 잘못된
//   계정으로 보고하는 보안 문제 발생. 그래서 onSuccess와 onError 양쪽 모두에 호출.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout as logoutApi } from "../services/authService";
import { useAuthStore } from "../stores/authStore";
import { stopBackgroundLocation } from "./useBackgroundLocation";

export function useLogout() {
  const queryClient = useQueryClient();
  const storeLogout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: logoutApi,
    // 성공 시 클라이언트 정리
    onSuccess: async () => {
      await stopBackgroundLocation(); // 1) OS 태스크 먼저 종료 (다른 정리보다 우선)
      storeLogout(); //                  2) Zustand에서 인증 상태 + 토큰 삭제
      queryClient.clear(); //            3) React Query 캐시 전체 비우기
    },
    // 서버 호출 실패해도 클라이언트 상태는 정리해야 함
    // (이미 만료된 토큰으로 logout 호출 시 401 떨어질 수 있음)
    onError: async () => {
      await stopBackgroundLocation();
      storeLogout();
      queryClient.clear();
    },
  });
}
