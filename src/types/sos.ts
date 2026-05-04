// SOS 도메인 타입.

export type SosLocationSource = "CLIENT" | "FALLBACK" | "NONE";

/** POST /api/sos 응답 (호출 직후 결과). */
export interface SosEvent {
  eventId: number;
  latitude: number | null;
  longitude: number | null;
  locationSource: SosLocationSource;
  notifiedGuardianCount: number;
  createdAt: string;
}

/** GET /api/sos/{eventId} 응답 (보호자 SosLocationView용 상세). */
export interface SosEventDetail {
  eventId: number;
  wardId: number;
  wardName: string;
  wardPhone: string;
  latitude: number | null;
  longitude: number | null;
  locationSource: SosLocationSource;
  notifiedGuardianCount: number;
  createdAt: string;
}

/** 호출 요청 입력. 모두 옵션. 위치 권한 거부/실패 시 모두 undefined. */
export interface SosTriggerInput {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}
