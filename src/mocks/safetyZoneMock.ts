// 안전구역 mock 데이터. 양산시청 좌표 기준.

import type { SafetyZone } from "../types/safetyZone";

// 김복자 어머니(id=1)의 등록 안전구역 3개
export const MOCK_SAFETY_ZONES: SafetyZone[] = [
  {
    id: 101,
    protegeId: 1,
    name: "우리집",
    type: "home",
    address: "경상남도 양산시 중앙로 39",
    latitude: 35.335,
    longitude: 129.0386,
    radius: 200,
    notificationEnabled: true,
    lastVisitedMinutesAgo: 8,
  },
  {
    id: 102,
    protegeId: 1,
    name: "동네 경로당",
    type: "senior_center",
    address: "경상남도 양산시 남부로 45",
    latitude: 35.3372,
    longitude: 129.042,
    radius: 150,
    notificationEnabled: true,
    lastVisitedMinutesAgo: 180, // 3시간 전
  },
  {
    id: 103,
    protegeId: 1,
    name: "양산부산대병원",
    type: "hospital",
    address: "경상남도 양산시 물금읍 금오로 20",
    latitude: 35.347,
    longitude: 129.0282,
    radius: 300,
    notificationEnabled: false, // 병원은 알림 끔
    lastVisitedMinutesAgo: 1440 * 3, // 3일 전
  },
];

// 김복자의 현재 위치 (안전구역 안 — 집 근처)
export const MOCK_PROTEGE_LOCATION = {
  latitude: 35.3352,
  longitude: 129.0388,
};
