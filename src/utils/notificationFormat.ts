// 알림 표시용 포맷 헬퍼.
//
// formatRelativeTime: 절대시각 → "3분 전 · 오후 9:31" 같은 상대+절대 혼합 표기.
//   상대 표현으로 "얼마나 됐는지" 감을 주고, 정확한 시각을 같이 붙여 확인 가능.
//   7일 넘은 알림은 날짜만 표시.
// notificationIcon: type별 Ionicons 이름 + 색상 매핑.

import type { NotificationType } from "../types/notification";
import { Colors } from "../theme/colors";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Date → "오전/오후 H:MM" (12시간제). */
function formatClock(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(m).padStart(2, "0")}`;
}

/**
 * ISO 시각 → 상대 + 절대 혼합 표기.
 *   - 오늘 안: "방금 전 · 오후 9:31" / "3분 전 · 오후 9:31" / "5시간 전 · 오후 2:10"
 *   - 1~6일 전: "3일 전 · 5월 22일"
 *   - 7일 이상: "5월 22일"
 * 알림센터·이상감지 기록 카드의 timestamp 표시용.
 */
export function formatRelativeTime(isoString: string): string {
  const pastDate = new Date(isoString);
  const past = pastDate.getTime();
  const diff = Date.now() - past;
  const clock = formatClock(pastDate);

  if (diff < MINUTE) return `방금 전 · ${clock}`;
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}분 전 · ${clock}`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전 · ${clock}`;

  const dateStr = `${pastDate.getMonth() + 1}월 ${pastDate.getDate()}일`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}일 전 · ${dateStr}`;

  // 7일 넘으면 날짜만
  return dateStr;
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
    case "ZONE_ENTER":
      return {
        name: "shield-checkmark-outline",
        color: Colors.semantic.success,
        bgColor: Colors.semantic.successBg,
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
    case "MEDICATION_DIGEST":
      return {
        name: "medkit-outline",
        color: Colors.brand.primary,
        bgColor: Colors.brand.primaryLight,
      };
    case "INACTIVITY_WARNING":
      return {
        name: "time-outline",
        color: Colors.semantic.warning,
        bgColor: Colors.semantic.warningBg,
      };
    case "DRUG_ANALYSIS_REFRESH_REQUEST":
      return {
        name: "shield-checkmark-outline",
        color: Colors.brand.primary,
        bgColor: Colors.brand.primaryLight,
      };
  }
}
