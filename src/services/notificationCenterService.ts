// 알림센터 도메인 API.
//
// FCM 토큰 발급 등 푸시 인프라 관련 코드는 notificationService.ts 에 있고,
// 이 파일은 백엔드 알림 이력 조회/읽음 처리 전용.
// 책임 분리해서 두 파일이 서로 의존하지 않도록 함.

import { api } from "./api";
import type { NotificationItem, UnreadCount } from "../types/notification";

/** GET /api/notifications — 내 알림 목록 (최신순) */
export async function getMyNotifications(): Promise<NotificationItem[]> {
  const res = await api.get<NotificationItem[]>("/api/notifications");
  return res.data;
}

/** GET /api/notifications/unread-count — 안 읽은 알림 개수 (배너/뱃지용) */
export async function getUnreadCount(): Promise<UnreadCount> {
  const res = await api.get<UnreadCount>("/api/notifications/unread-count");
  return res.data;
}

/** PATCH /api/notifications/{id}/read — 알림 읽음 처리 (idempotent) */
export async function markNotificationAsRead(
  id: number,
): Promise<NotificationItem> {
  const res = await api.patch<NotificationItem>(
    `/api/notifications/${id}/read`,
  );
  return res.data;
}
