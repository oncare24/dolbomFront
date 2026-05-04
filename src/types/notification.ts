// 알림 도메인 타입.
//
// 백엔드 NotificationType enum과 동일한 문자열로 통일 (변환 불필요).
// 백엔드 NotificationResponse, UnreadCountResponse DTO와 1:1 매핑.

export type NotificationType =
  | "ZONE_EXIT"
  | "DEVICE_DISCONNECTED"
  | "WARD_INVITATION"
  | "SOS"
  | "MEDICATION_MISSED"
  | "INACTIVITY_WARNING";

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  wardId: number | null;
  relatedZoneId: number | null;
  sosEventId: number | null;
  createdAt: string;
  readAt: string | null;
}

export interface UnreadCount {
  count: number;
}
