// 알림 도메인 타입.
//
// 백엔드 NotificationType enum과 동일한 문자열로 통일 (변환 불필요).
// 백엔드 NotificationResponse, UnreadCountResponse DTO와 1:1 매핑.

export type NotificationType =
  | "ZONE_EXIT"
  | "ZONE_ENTER"
  | "DEVICE_DISCONNECTED"
  | "WARD_INVITATION"
  | "SOS"
  | "MEDICATION_MISSED"
  | "MEDICATION_DIGEST"
  | "INACTIVITY_WARNING"
  | "DRUG_ANALYSIS_REFRESH_REQUEST";

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

// ─── 알림 설정 (보호자 전용) ────────────────────────────────
// GET /api/notifications/preferences 응답 + PATCH 요청 타입.
// dailyDigestTime은 백엔드 LocalTime이 @JsonFormat("HH:mm")로 직렬화됨.

export interface NotificationPreference {
  immediateMedicationAlert: boolean;
  dailyDigestEnabled: boolean;
  /** "HH:MM" 24시간제 (예: "22:00") */
  dailyDigestTime: string;
}

export interface UpdateNotificationPreferenceRequest {
  immediateMedicationAlert?: boolean;
  dailyDigestEnabled?: boolean;
  /** "HH:MM" 24시간제 (예: "21:30") */
  dailyDigestTime?: string;
}
