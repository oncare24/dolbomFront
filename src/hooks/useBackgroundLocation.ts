// 백그라운드 위치 추적 라이프사이클 훅.
//
// 호출 시점: 피보호자가 로그인된 상태로 홈 화면 진입할 때.
// 동작:
//   1) 권한 확인 (포그라운드 + 백그라운드 둘 다)
//   2) 이미 추적 중이면 그대로 둠 (중복 시작 방지)
//   3) 추적 안 중이면 startLocationUpdatesAsync 시작
//
// 멈추는 책임은 이 훅이 아닌 별도 로직(로그아웃, 보호자 계정 전환 등)에서.
// 단순히 화면 unmount로 멈추면 안 됨 — 백그라운드 추적의 본질에 어긋남.

import { useEffect } from "react";
import * as Location from "expo-location";
import { BACKGROUND_LOCATION_TASK } from "../services/backgroundLocationTask";

// const REPORT_INTERVAL_MS = 30 * 60 * 1000; // 30분
const REPORT_INTERVAL_MS = 1 * 60 * 1000; // 검증용 1분 (발표 후 30분으로 복원)
export function useBackgroundLocation(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    (async () => {
      // 포그라운드 권한
      console.log("[BG-HOOK] start");

      const fg = await Location.requestForegroundPermissionsAsync();
      console.log("[BG-HOOK] fg =", fg.status); // ← 추가

      if (fg.status !== "granted") {
        console.warn("[BG-LOCATION] foreground permission denied");
        return;
      }

      // 백그라운드 권한 (Android: ACCESS_BACKGROUND_LOCATION)
      const bg = await Location.requestBackgroundPermissionsAsync();
      console.log("[BG-HOOK] bg =", bg.status); // ← 추가

      if (bg.status !== "granted") {
        console.warn("[BG-LOCATION] background permission denied");
        return;
      }

      if (cancelled) return;

      const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK,
      );
      console.log("[BG-HOOK] alreadyRunning =", alreadyRunning); // ← 추가

      if (alreadyRunning) return;

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: REPORT_INTERVAL_MS,
        deferredUpdatesInterval: REPORT_INTERVAL_MS, //임시테스ㅡ용

        distanceInterval: 0,
        // 안드로이드: foregroundService 알림이 떠 있어야 OS가 태스크 살려둠.
        foregroundService: {
          notificationTitle: "보살핌 - 위치 보호 활성화",
          notificationBody: "안전한 모니터링을 위해 위치를 확인하고 있어요.",
          notificationColor: "#3478F6",
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });
      console.log("[BG-HOOK] startLocationUpdatesAsync called"); // ← 추가
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}

/** 로그아웃 시 호출. 추적 중이면 멈춤. */
export async function stopBackgroundLocation(): Promise<void> {
  const running = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK,
  );
  if (running) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}
//할것들
// 1분 → 30분으로 복원
//const REPORT_INTERVAL_MS = 30 * 60 * 1000;
// 임시 stop 로직 제거 — 원래대로
//if (alreadyRunning) return;
// console.log 디버깅 라인들 제거 (선택)
