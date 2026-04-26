// 사용자 설정 store. 햅틱 on/off, 추후 글씨 크기 옵션 등.
// AsyncStorage에 저장되어 앱 재시작해도 유지됨.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  // ─── state ───
  hapticEnabled: boolean;
  // 추후 추가 예정: fontScale, soundEnabled, ttsSpeed 등

  // ─── actions ───
  setHapticEnabled: (enabled: boolean) => void;
  toggleHaptic: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticEnabled: true,

      setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),
      toggleHaptic: () => set((s) => ({ hapticEnabled: !s.hapticEnabled })),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
