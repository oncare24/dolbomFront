// 알림 표시용 포맷 헬퍼.
//
// formatRelativeTime: 절대시각 → "3분 전" 같은 상대시각.
//   너무 오래된 알림은 그냥 날짜 표시로 폴백.
// notificationIcon: type별 Ionicons 이름 + 색상 매핑.

import type { NotificationType } from "../types/notification";
import { Colors } from "../theme/colors";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * ISO 시각 → "방금 전 / N분 전 / N시간 전 / N일 전 / 절대 날짜" 변환.
 * 알림센터 카드의 timestamp 표시용.
 */
export function formatRelativeTime(isoString: string): string {
  const past = new Date(isoString).getTime();
  const now = Date.now();
  const diff = now - past;

  if (diff < MINUTE) return "방금 전";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}분 전`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}일 전`;

  // 7일 넘으면 절대 날짜
  const d = new Date(past);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 알림 타입별 아이콘 + 색상. Ionicons 이름. */
export interface NotificationIconSpec {
  name: string;
  color: string;
  bgColor: string;
}

export function getNotificationIcon(
  type: NotificationType,
): NotificationIconSpec {
  switch (type) {
    case "ZONE_EXIT":
      return {
        name: "location-outline",
        color: Colors.semantic.danger,
        bgColor: Colors.semantic.dangerBg,
      };
    case "DEVICE_DISCONNECTED":
      return {
        name: "cellular-outline",
        color: Colors.semantic.warning,
        bgColor: Colors.semantic.warningBg,
      };
    case "WARD_INVITATION":
      return {
        name: "person-add-outline",
        color: Colors.brand.primary,
        bgColor: Colors.brand.primaryLight,
      };
    case "SOS":
      return {
        name: "alert-circle-outline",
        color: Colors.semantic.danger,
        bgColor: Colors.semantic.dangerBg,
      };
    case "MEDICATION_MISSED":
      return {
        name: "medkit-outline",
        color: Colors.semantic.warning,
        bgColor: Colors.semantic.warningBg,
      };
    case "INACTIVITY_WARNING":
      return {
        name: "time-outline",
        color: Colors.semantic.warning,
        bgColor: Colors.semantic.warningBg,
      };
  }
}
