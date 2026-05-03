// 백엔드 병원 추천 도메인 타입.
//
// Spring Boot의 POST /api/hospitals/recommend 응답 구조와 1:1 매칭.
// api.ts 인터셉터가 ApiResponse를 unwrap해주므로 data 필드는 신경 쓸 필요 없음.

/** 사용자에게 보여줄 병원 정보 (백엔드 ScoredHospital). */
export interface ScoredHospital {
  name: string;
  address: string;
  tel: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  isOpenNow: boolean | null;
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
 * - department: LLM이 선택한 1순위 진료과 한국어 (예: "치과")
 * - secondaryDepartment: 차순위 진료과 한국어 (없으면 null. 예: "이비인후과")
 * - confidence: LLM 분류 자신도 (0.0~1.0). UI에 "분석 정확도 92%" 같은 형태로 표시 가능.
 * - reason: 사용자 친화적 설명문 (예: "치아·잇몸 통증으로 치과 진료가 필요해 보입니다.")
 */
export interface RecommendResponse {
  department: string;
  departmentCode: string;
  secondaryDepartment: string | null;
  confidence: number;
  reason: string;
  hospitals: ScoredHospital[];
  userLatitude: number;
  userLongitude: number;
  locationSource: "REQUEST" | "RECENT_REPORT" | "SAFETY_ZONE";
}
