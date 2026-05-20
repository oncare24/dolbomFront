// 복약 안전 분석 인증 흐름 임시 메모리.
//
// 보안 원칙:
//  - persist 절대 X (SecureStore / AsyncStorage 사용 금지).
//  - 4개 화면(Intro → Form → Waiting → Result) 사이 폼/세션 전달 전용.
//  - Intro 진입 시 / Result 도착 직후 / 흐름 이탈 시 reset() 호출 필수.

import { create } from "zustand";
import type { CodefAuthInput, CodefAuthSession } from "../types/drugSafety";

interface DrugSafetyAuthState {
  authInput: CodefAuthInput | null;
  session: CodefAuthSession | null;
  setAuthInput: (input: CodefAuthInput) => void;
  setSession: (session: CodefAuthSession) => void;
  reset: () => void;
}

export const useDrugSafetyAuthStore = create<DrugSafetyAuthState>((set) => ({
  authInput: null,
  session: null,
  setAuthInput: (authInput) => set({ authInput }),
  setSession: (session) => set({ session }),
  reset: () => set({ authInput: null, session: null }),
}));
