// ============================================================
// Mock 데이터 — Tmap API 없이 테스트용
// ============================================================
// 구미역 → 금오공대 방면 가상 보행 경로 (5카드)
// import해서 parseTmapResponse()에 넘기면 카드 배열이 나옴

import type { TmapResponse } from "../types/navigation";

export const MOCK_TMAP_RESPONSE: TmapResponse = {
  type: "FeatureCollection",
  features: [
    // ── Card 0: 출발 ──
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [128.343, 36.119] },
      properties: {
        index: 0,
        pointIndex: 0,
        name: "구미역",
        description: "구미역에서 출발합니다",
        direction: "",
        nearPoiName: "구미역",
        nearPoiX: "128.3430",
        nearPoiY: "36.1190",
        intersectionName: "",
        facilityType: "",
        facilityName: "",
        turnType: 200,
        pointType: "SP",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [128.343, 36.119],
          [128.3435, 36.1192],
          [128.344, 36.1195],
          [128.3448, 36.1198],
          [128.3455, 36.12],
        ],
      },
      properties: {
        index: 1,
        lineIndex: 0,
        name: "송정대로",
        description: "송정대로를 따라 이동",
        distance: 180,
        time: 130,
        roadType: 0,
        categoryRoadType: 0,
        facilityType: "",
        facilityName: "",
      },
    },

    // ── Card 1: 좌회전 ──
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [128.3455, 36.12] },
      properties: {
        index: 2,
        pointIndex: 1,
        name: "송정사거리",
        description: "송정사거리에서 좌회전 하세요",
        direction: "",
        nearPoiName: "GS25 송정점",
        nearPoiX: "128.3456",
        nearPoiY: "36.1201",
        intersectionName: "송정사거리",
        facilityType: "",
        facilityName: "",
        turnType: 12,
        pointType: "PP",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [128.3455, 36.12],
          [128.3455, 36.1205],
          [128.3454, 36.121],
          [128.3453, 36.1218],
          [128.3452, 36.1225],
        ],
      },
      properties: {
        index: 3,
        lineIndex: 1,
        name: "대학로",
        description: "대학로를 따라 직진",
        distance: 280,
        time: 200,
        roadType: 0,
        categoryRoadType: 0,
        facilityType: "",
        facilityName: "",
      },
    },

    // ── Card 2: 횡단보도 ──
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [128.3452, 36.1225] },
      properties: {
        index: 4,
        pointIndex: 2,
        name: "",
        description: "횡단보도를 건너세요",
        direction: "",
        nearPoiName: "",
        nearPoiX: "",
        nearPoiY: "",
        intersectionName: "",
        facilityType: "",
        facilityName: "",
        turnType: 211,
        pointType: "PP",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [128.3452, 36.1225],
          [128.345, 36.1226],
          [128.3448, 36.1227],
        ],
      },
      properties: {
        index: 5,
        lineIndex: 2,
        name: "",
        description: "",
        distance: 30,
        time: 25,
        roadType: 0,
        categoryRoadType: 0,
        facilityType: "",
        facilityName: "",
      },
    },

    // ── Card 3: 직진 ──
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [128.3448, 36.1227] },
      properties: {
        index: 6,
        pointIndex: 3,
        name: "",
        description: "전방 200m 직진하세요",
        direction: "",
        nearPoiName: "",
        nearPoiX: "",
        nearPoiY: "",
        intersectionName: "",
        facilityType: "",
        facilityName: "",
        turnType: 11,
        pointType: "PP",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [128.3448, 36.1227],
          [128.3447, 36.1232],
          [128.3446, 36.1238],
          [128.3445, 36.1245],
          [128.3444, 36.125],
        ],
      },
      properties: {
        index: 7,
        lineIndex: 3,
        name: "대학로",
        description: "대학로 직진",
        distance: 200,
        time: 145,
        roadType: 0,
        categoryRoadType: 0,
        facilityType: "",
        facilityName: "",
      },
    },

    // ── Card 4: 도착 ──
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [128.3444, 36.125] },
      properties: {
        index: 8,
        pointIndex: 4,
        name: "금오공과대학교",
        description: "목적지 금오공과대학교에 도착했습니다",
        direction: "",
        nearPoiName: "금오공과대학교",
        nearPoiX: "128.3444",
        nearPoiY: "36.1250",
        intersectionName: "",
        facilityType: "",
        facilityName: "",
        turnType: 201,
        pointType: "EP",
      },
    },
  ],
};
