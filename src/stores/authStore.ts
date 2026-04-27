// 인증 상태 관리. 자동 로그인을 위해 secure-store에 persist.
// 백엔드 연동 시 hydrate 시점에 토큰 검증 API 호출 추가 예정.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

export type UserRole = "elderly" | "guardian";

export interface AuthUser {
  id: number;
  name: string;
  phoneNumber: string;
  role: UserRole;
}

interface AuthState {
  // 상태
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  isHydrated: boolean; // persist 복원 완료 여부 (스플래시 → 화면 전환 분기에 사용)

  // 액션
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  _setHydrated: () => void;
}

// secure-store를 zustand persist 어댑터로 변환
const secureStorage = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      isHydrated: false,

      login: (token, user) =>
        set({
          isAuthenticated: true,
          accessToken: token,
          user,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          accessToken: null,
          user: null,
        }),

      _setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => secureStorage),
      // hydration 완료 시점 알림 (App.tsx에서 스플래시 분기에 사용)
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
      // isHydrated는 persist 대상에서 제외 (매번 false로 시작해야 함)
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);
