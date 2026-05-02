// Tmap 보행자 API의 응답 형식 (GeoJSON FeatureCollection).
//
// 친구의 NavigationScreen / parseTmapResponse가 이 형식을 기대.
// 우리는 백엔드 응답을 이 형식으로 변환해서 넘김 (utils/tmapResponseAdapter.ts).

export interface TmapResponse {
  type: "FeatureCollection";
  features: TmapFeature[];
}

export type TmapFeature = TmapPointFeature | TmapLineStringFeature;

/**
 * Point feature: 안내 지점 (출발/회전/도착 등 한 포인트).
 * properties.turnType이 핵심.
 */
export interface TmapPointFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  properties: TmapPointProperties;
}

export interface TmapPointProperties {
  index: number;
  pointIndex?: number;
  name?: string;
  description: string;
  direction?: string;
  intersectionName?: string;
  /**
   * 회전 종류:
   *  200 출발, 201 도착, 211/212/213/214 횡단보도,
   *  11 직진, 12 좌회전, 13 우회전, 14 유턴 등
   */
  turnType: number;
  pointType?: string; // SP(시작), EP(끝) 등
  facilityType?: string;
  facilityName?: string;
  nearPoiName?: string;
  nearPoiX?: string;
  nearPoiY?: string;
  totalDistance?: number;
  totalTime?: number;
}

/**
 * LineString feature: 두 안내 지점 사이의 경로 좌표.
 * 직전 Point feature와 짝을 이뤄 카드 1장이 됨.
 */
export interface TmapLineStringFeature {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: [number, number][]; // [[lon, lat], ...]
  };
  properties: TmapLineStringProperties;
}

export interface TmapLineStringProperties {
  index: number;
  lineIndex?: number;
  name?: string;
  description?: string;
  distance: number;
  time: number;
}
