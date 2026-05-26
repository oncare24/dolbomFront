// src/utils/getAccurateLocation.ts (신규)
import * as Location from "expo-location";

/**
 * 네이버/티맵처럼 "한 번 찍고 끝"이 아니라 잠깐 추적해
 * 정확도가 수렴한 위치를 사용한다.
 * - 정확도 30m 이하로 잡히면 즉시 사용, 아니면 timeoutMs까지 그중 제일 정확한 값.
 * - 아무 값도 못 받으면 null (호출부에서 폴백 처리).
 */
export async function getAccurateLocation(
  timeoutMs = 6000,
): Promise<Location.LocationObject | null> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== "granted") return null;

  return new Promise((resolve) => {
    let best: Location.LocationObject | null = null;
    let sub: Location.LocationSubscription | null = null;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      sub?.remove();
      resolve(best);
    };

    const timer = setTimeout(finish, timeoutMs);

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 0,
      },
      (loc) => {
        const acc = loc.coords.accuracy ?? Number.MAX_VALUE;
        if (!best || acc < (best.coords.accuracy ?? Number.MAX_VALUE)) {
          best = loc;
        }
        if (acc <= 30) {
          clearTimeout(timer);
          finish();
        }
      },
    ).then((s) => {
      if (done) s.remove();
      else sub = s;
    });
  });
}
