// ============================================================
// Tmap 보행자 API 응답 타입 + 카드 구조
// ============================================================
// 좌표 순서 주의: Tmap은 [경도, 위도] → 파싱할 때 뒤집어야 함!

/** Tmap 응답 최상위 */
export interface TmapResponse {
  type: "FeatureCollection";
  features: TmapFeature[];
}

export type TmapFeature = TmapPointFeature | TmapLineStringFeature;

/** Point: 안내 지점 */
export interface TmapPointFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [경도, 위도]
  };
  properties: {
    index: number;
    pointIndex: number;
    name: string;
    description: string;
    direction: string;
    nearPoiName: string;
    nearPoiX: string;
    nearPoiY: string;
    intersectionName: string;
    facilityType: string;
    facilityName: string;
    turnType: number;
    pointType: string; // SP(출발), EP(도착), GP(경유), PP(일반)
  };
}

/** LineString: 경로 좌표 배열 */
export interface TmapLineStringFeature {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: [number, number][]; // [경도, 위도][]
  };
  properties: {
    index: number;
    lineIndex: number;
    name: string;
    description: string;
    distance: number; // 미터
    time: number; // 초
    roadType: number;
    categoryRoadType: number;
    facilityType: string;
    facilityName: string;
  };
}

// ============================================================
// 변환된 카드 구조
// ============================================================

/** 하나의 길안내 카드 */
export interface NavigationCard {
  index: number;
  point: { latitude: number; longitude: number };
  turnType: number;
  turnLabel: string;
  description: string;
  name: string;
  pathCoords: { latitude: number; longitude: number }[];
  distance: number; // 미터
  duration: number; // 초
  pointType: "start" | "end" | "waypoint" | "normal";
}

/** 전체 경로 정보 */
export interface NavigationRoute {
  cards: NavigationCard[];
  fullPath: { latitude: number; longitude: number }[];
  totalDistance: number;
  totalDuration: number;
}

/** GPS 추적 상태 */
export interface NavigationState {
  currentCardIndex: number;
  currentLocation: { latitude: number; longitude: number } | null;
  status: "idle" | "navigating" | "arrived" | "off-route";
  distanceToNext: number;
}
