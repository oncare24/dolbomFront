// 보호자 알림 설정 API.
//
// 토글 2개 + 다이제스트 시각 1개. 행이 없으면 백엔드가 자동으로 default(둘 다 ON, 22:00) 생성 후 반환.
// 책임 분리: notificationCenterService.ts는 알림 이력 조회/읽음 처리 전용. 설정은 이 파일만.

import { api } from "./api";
import type {
  NotificationPreference,
  UpdateNotificationPreferenceRequest,
} from "../types/notification";

/** GET /api/notifications/preferences — 내 알림 설정 (행 없으면 default 자동 생성 후 반환) */
export async function getMyNotificationPreference(): Promise<NotificationPreference> {
  const res = await api.get<NotificationPreference>(
    "/api/notifications/preferences",
  );
  return res.data;
}

/** PATCH /api/notifications/preferences — null 필드는 변경 안 함 (부분 업데이트) */
export async function updateMyNotificationPreference(
  request: UpdateNotificationPreferenceRequest,
): Promise<NotificationPreference> {
  const res = await api.patch<NotificationPreference>(
    "/api/notifications/preferences",
    request,
  );
  return res.data;
}
