// 인증 상태 관리. secure-store에 persist (앱 재시작 시 자동 로그인).
//
// 변경점(2026-04-28):
//  - refreshToken 추가 저장
//  - updateTokens(): axios 인터셉터의 자동 재발급 시 토큰만 갱신용
//
// 변경점(2026-05-02):
//  - setTokensOnly(): 로그인 흐름에서 getMe 전에 토큰만 임시 저장.
//    isAuthenticated는 false 유지 → 라우팅이 elderly/guardian 분기 안 함.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

export type UserRole = "elderly" | "guardian";

export interface AuthUser {
  id: number;
  name: string;
  phoneNumber: string; // 표시용. 하이픈 포함 형식.
  role: UserRole;
}

interface AuthState {
  // 상태
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;

  // 액션
  setTokensOnly: (accessToken: string, refreshToken: string) => void;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  _setHydrated: () => void;
}

const secureStorage = {
  getItem: async (key: string) => SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: async (key: string) => SecureStore.deleteItemAsync(key),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,

      // 로그인 흐름 1단계: 토큰만 임시 저장 (getMe 호출 시 axios 인터셉터가 헤더 부착용으로 사용).
      // isAuthenticated를 false로 유지해서 App.tsx 라우팅이 분기 안 하게 함.
      setTokensOnly: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
        }),

      // 로그인 흐름 2단계: getMe 결과까지 받아서 한 번에 인증 완료 + user 채움.
      // 이 시점에 비로소 isAuthenticated=true → 라우팅이 정확한 화면으로 분기.
      login: (accessToken, refreshToken, user) =>
        set({
          isAuthenticated: true,
          accessToken,
          refreshToken,
          user,
        }),

      updateTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      logout: () =>
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          user: null,
        }),

      _setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
