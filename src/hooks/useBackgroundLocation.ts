import { useEffect } from "react";
import * as Location from "expo-location";
import { BACKGROUND_LOCATION_TASK } from "../services/backgroundLocationTask";
import { requestInSequence } from "../utils/permissionQueue";

const REPORT_INTERVAL_MS = 30 * 60 * 1000; // 30분

export function useBackgroundLocation(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      void stopBackgroundLocation();
      return;
    }
    let cancelled = false;

    (async () => {
      // 포그라운드 권한
      const fg = await requestInSequence(() =>
        Location.requestForegroundPermissionsAsync(),
      );
      if (fg.status !== "granted") {
        console.warn("[BG-LOCATION] foreground permission denied");
        return;
      }

      // 백그라운드 권한 (Android: ACCESS_BACKGROUND_LOCATION)
      const bg = await requestInSequence(() =>
        Location.requestBackgroundPermissionsAsync(),
      );
      if (bg.status !== "granted") {
        console.warn("[BG-LOCATION] background permission denied");
        return;
      }

      if (cancelled) return;

      const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK,
      );
      if (alreadyRunning) return;

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: REPORT_INTERVAL_MS,
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
