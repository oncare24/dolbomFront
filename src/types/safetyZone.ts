// 안전구역 도메인 타입.
//
// 프론트 명명 규약:
//  - protegeId: 사용자 화면/스토어용 (피보호자=protege)
//  - 백엔드는 wardId로 사용 → service 레이어에서 자동 변환
//
// 타입(home/senior_center/...)은 프론트 소문자 ↔ 백엔드 대문자 (SafetyZoneType enum)
//  변환은 safetyZoneService.ts의 toFront/toBackend 헬퍼에서 처리.

export type SafetyZoneType = "home" | "senior_center" | "hospital" | "custom";

export interface SafetyZone {
  id: number;
  protegeId: number;
  guardianId: number; // 누가 등록했는지 (수정/삭제 권한 판정용)
  name: string; // "우리집", "동네 경로당"
  type: SafetyZoneType;
  address: string; // "부산광역시 양산시 ㅇㅇ동 123"
  latitude: number;
  longitude: number;
  radius: number; // 미터 (최소 200, 최대 1000)
  notificationEnabled: boolean;
  lastVisitedMinutesAgo: number | null; // null이면 방문 기록 없음. 위치 보고 도메인(Step 8)에서 채움
}

export const SAFETY_ZONE_MAX_COUNT = 5;
export const SAFETY_ZONE_MIN_RADIUS = 200;
export const SAFETY_ZONE_MAX_RADIUS = 1000;

export type SafetyZoneFormValues = Omit<
  SafetyZone,
  "id" | "guardianId" | "lastVisitedMinutesAgo" | "notificationEnabled"
> & {
  notificationEnabled: boolean;
};
