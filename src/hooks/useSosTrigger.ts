// SOS 호출 mutation 훅.
//
// 책임:
//   1) 위치 권한 보유 시 expo-location.getCurrentPositionAsync()로 실시간 GPS 1회 획득 (3초 타임아웃)
//   2) 권한 없거나 실패하면 좌표 없이 호출 (백엔드가 location_reports 최신값으로 폴백)
//   3) react-query useMutation으로 결과 노출
//
// 위치 획득 실패가 SOS 실패로 이어지지 않게 — 긴급 도메인의 본질.

import { useMutation } from "@tanstack/react-query";
import * as Location from "expo-location";
import { triggerSos } from "../services/sosService";
import type { SosEvent, SosTriggerInput } from "../types/sos";

/** 실시간 GPS 획득 타임아웃. 시니어가 답답하게 안 느끼도록 짧게. */
const LOCATION_TIMEOUT_MS = 3000;

/**
 * 현재 위치를 한 번만 가져온다. 권한 없거나 타임아웃이면 undefined 반환.
 * - getCurrentPositionAsync는 자체 timeout이 없어 Promise.race로 강제 종료
 */
async function getCurrentLocationOrUndefined(): Promise<SosTriggerInput> {
  try {
    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== "granted") {
      // 권한 없음 — 묵묵히 좌표 없이 진행. 시니어에게 권한 안내는 호출 흐름 외부 책임.
      return {};
    }

    const positionPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS),
    );

    const result = await Promise.race([positionPromise, timeoutPromise]);
    if (result === null) return {}; // 타임아웃

    return {
      latitude: result.coords.latitude,
      longitude: result.coords.longitude,
      accuracy: result.coords.accuracy ?? undefined,
    };
  } catch (e) {
    console.warn("[SOS] getCurrentPosition failed:", e);
    return {};
  }
}

/**
 * SOS 호출.
 *
 * 사용 예시:
 * ```tsx
 * const { mutateAsync, isPending } = useSosTrigger();
 * const result = await mutateAsync();   // 인자 불필요 — 위치는 훅 안에서 자동 획득
 * if (result.notifiedGuardianCount === 0) { ... }
 * ```
 */
export function useSosTrigger() {
  return useMutation<SosEvent, unknown, void>({
    mutationFn: async () => {
      const location = await getCurrentLocationOrUndefined();
      return triggerSos(location);
    },
  });
}
