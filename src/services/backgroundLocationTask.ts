// 백그라운드 위치 태스크.
//
// expo-location의 startLocationUpdatesAsync로 등록되는 태스크. 30분 주기로 OS가 호출.
// 한 번 임포트되면 TaskManager에 글로벌 등록되므로, App.tsx 최상단에서 side-effect import 필수:
//   import "./src/services/backgroundLocationTask";
//
// 메모리 #5 검증된 구조: foregroundService 옵션으로 상태바 알림 띄워서 안드로이드 OS가 태스크 강제 종료 못 하게 함.

import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { reportLocation } from "./locationService";

export const BACKGROUND_LOCATION_TASK = "boslapim-background-location-task";

interface LocationTaskData {
  locations: Location.LocationObject[];
}

TaskManager.defineTask<LocationTaskData>(
  BACKGROUND_LOCATION_TASK,
  async ({ data, error }) => {
    if (error) {
      console.warn("[BG-LOCATION] task error:", error.message);
      return;
    }
    if (!data?.locations?.length) {
      return;
    }

    // OS가 한 번에 여러 좌표를 묶어 보낼 수 있음. 가장 최신 1건만 사용.
    const latest = data.locations[data.locations.length - 1];
    const { latitude, longitude, accuracy } = latest.coords;

    try {
      await reportLocation({
        latitude,
        longitude,
        accuracy: accuracy ?? 9999, // accuracy null이면 서버에서 어차피 silent drop됨
        reportSource: "BACKGROUND_SCHEDULED",
      });
    } catch (e) {
      // 백그라운드 태스크 안에서는 토스트 띄울 컨텍스트가 없음. 로그만 남기고 다음 주기 대기.
      console.warn("[BG-LOCATION] report failed:", e);
    }
  },
);
