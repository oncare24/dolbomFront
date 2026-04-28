// 보호자 홈 도메인 타입.

export type ProtegeStatusType =
  | "inside"
  | "outside"
  | "disconnected"
  | "unknown";

export interface Protege {
  id: number;
  name: string;
  relationship: string; // "어머니"/"아버지" 등. 미입력 시 빈 문자열.
  status: ProtegeStatusType;
  locationLabel: string; // "집 근처" / "안전구역 외부" / "마지막 위치 확인 중" / "위치 정보 없음" 등
  lastReportedMinutesAgo: number | null; // null = 한 번도 보고 없음
  avatarColor: string; // 이름 해시로 자동 생성된 hex
}
