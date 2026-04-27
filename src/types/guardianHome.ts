// 보호자 홈 도메인 타입.

export type ProtegeStatusType = "inside" | "outside" | "disconnected";

export interface Protege {
  id: number;
  name: string;
  relationship: string; // "어머니", "아버지" 등
  age: number;
  status: ProtegeStatusType;
  locationLabel: string; // "집 근처" / "안전구역 외부" / "마지막 위치 확인 중"
  lastReportedMinutesAgo: number;
  avatarColor: string; // 이니셜 아바타 배경색
}
