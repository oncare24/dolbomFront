// 백엔드 병원 추천 도메인 타입.
//
// Spring Boot의 POST /api/hospitals/recommend 응답 구조와 1:1 매칭.
// api.ts 인터셉터가 ApiResponse를 unwrap해주므로 data 필드는 신경 쓸 필요 없음.

export type Urgency = "LOW" | "MEDIUM" | "HIGH";

/** 사용자에게 보여줄 병원 정보 (백엔드 ScoredHospital). */
export interface ScoredHospital {
  name: string;
  address: string;
  tel: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  isOpenNow: boolean | null;
  isEmergency: boolean;
  emergencyClass: number | null;
  score: number;
}

/**
 * 병원 추천 요청.
 *
 * 위치는 모두 선택값 — 누락 시 백엔드 폴백 체인 동작:
 *   요청 lat/lon → 최근 LocationReport(5분 이내) → 안전구역 첫 번째 → 404
 *
 * radius 단위는 미터, 1000~20000 사이. 미지정 시 5000(5km).
 */
export interface RecommendRequest {
  symptoms: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

/**
 * 병원 추천 응답.
 *
 * urgency=HIGH인 경우:
 *   - hospitals는 일반 병의원 대신 응급의료기관 리스트
 *   - emergencyAlert 문구 포함 (UI에서 강조 표시 권장)
 */
export interface RecommendResponse {
  department: string;
  departmentCode: string;
  urgency: Urgency;
  reason: string;
  emergencyAlert: string | null;
  hospitals: ScoredHospital[];
  userLatitude: number;
  userLongitude: number;
  locationSource: "REQUEST" | "RECENT_REPORT" | "SAFETY_ZONE";
}
