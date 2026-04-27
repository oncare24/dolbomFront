// 안전구역 도메인 타입.

export type SafetyZoneType = "home" | "senior_center" | "hospital" | "custom";

export interface SafetyZone {
  id: number;
  protegeId: number;
  name: string; // "우리집", "동네 경로당"
  type: SafetyZoneType;
  address: string; // "부산광역시 양산시 ㅇㅇ동 123"
  latitude: number;
  longitude: number;
  radius: number; // 미터 (최소 200, 최대 1000)
  notificationEnabled: boolean;
  lastVisitedMinutesAgo: number | null; // null이면 방문 기록 없음
}

export const SAFETY_ZONE_MAX_COUNT = 5;
export const SAFETY_ZONE_MIN_RADIUS = 200;
export const SAFETY_ZONE_MAX_RADIUS = 1000;
