// ============================================================
// Tmap 보행자 API 호출 서비스
// ============================================================
// ⚠️ 프로토타입 전용 — 프론트에서 직접 호출
// 최종 구조에서는 백엔드(Spring Boot)가 호출하고 카드 배열만 내려줌
//
// Tmap appKey를 프론트 코드에 넣으면 디컴파일로 노출 위험 있으니
// 반드시 나중에 백엔드로 옮겨야 함!

import type { TmapResponse } from "../types/navigation";

// ── 여기에 본인 appKey 넣기 ──
const TMAP_APP_KEY = "IG7LMaoL5O8dXzpYstkuP8P8xMPhqIMy5OBmK5Kd";

const TMAP_PEDESTRIAN_URL =
  "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1";

interface TmapRouteRequest {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  startName?: string;
  endName?: string;
}

/**
 * Tmap 보행자 경로 API 호출
 *
 * @returns TmapResponse (FeatureCollection) — 그대로 parseTmapResponse()에 넘기면 됨
 * @throws 네트워크 에러 또는 API 에러
 */
export async function fetchPedestrianRoute(
  request: TmapRouteRequest,
): Promise<TmapResponse> {
  const body = {
    startX: String(request.startLng), // Tmap은 경도가 X
    startY: String(request.startLat), // Tmap은 위도가 Y
    endX: String(request.endLng),
    endY: String(request.endLat),
    startName: request.startName ?? "출발지",
    endName: request.endName ?? "도착지",
    reqCoordType: "WGS84GEO", // GPS 좌표계
    resCoordType: "WGS84GEO", // 응답도 GPS 좌표계로
    searchOption: "0", // 추천 경로
  };

  console.log("[TmapService] 경로 요청:", body);

  const response = await fetch(TMAP_PEDESTRIAN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      appKey: TMAP_APP_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[TmapService] 에러:", response.status, errorText);
    throw new Error(`Tmap API 에러 (${response.status}): ${errorText}`);
  }

  const data: TmapResponse = await response.json();

  console.log(`[TmapService] 응답: ${data.features?.length ?? 0}개 features`);

  return data;
}

/**
 * 현재 위치 기반으로 경로 요청 (편의 함수)
 * GPS에서 현재 위치 받아서 → 목적지까지 경로 요청
 */
export async function fetchRouteFromCurrentLocation(
  endLat: number,
  endLng: number,
  endName?: string,
): Promise<TmapResponse> {
  const Location = require("expo-location");

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("위치 권한이 필요합니다");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return fetchPedestrianRoute({
    startLat: location.coords.latitude,
    startLng: location.coords.longitude,
    endLat,
    endLng,
    startName: "현재 위치",
    endName: endName ?? "목적지",
  });
}
