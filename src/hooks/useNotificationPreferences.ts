// 보호자 알림 설정 react-query 훅.
//
// useNotificationPreference: 조회. 진입 시 GET 1회.
// useUpdateNotificationPreference: 토글/시각 변경 (Optimistic) — UI 즉시 반응 + 실패 시 롤백.
//
// 패턴은 useNotifications.ts(useMarkAsRead)와 동일.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyNotificationPreference,
  updateMyNotificationPreference,
} from "../services/notificationPreferenceService";
import type {
  NotificationPreference,
  UpdateNotificationPreferenceRequest,
} from "../types/notification";

// ───────────────────────────────────────────────────────
// Query Keys
// ───────────────────────────────────────────────────────
export const notificationPreferenceKeys = {
  all: ["notification-preferences"] as const,
  detail: () => [...notificationPreferenceKeys.all, "detail"] as const,
};

// ───────────────────────────────────────────────────────
// Query
// ───────────────────────────────────────────────────────

/** 내 알림 설정 조회. 행 없으면 백엔드가 default 자동 생성. */
export function useNotificationPreference() {
  return useQuery({
    queryKey: notificationPreferenceKeys.detail(),
    queryFn: getMyNotificationPreference,
    // 진입 시 매번 새로 받기보단 캐시 사용. 다른 기기에서 바꾸는 일 거의 없음.
    staleTime: 5 * 60 * 1000, // 5분
  });
}

// ───────────────────────────────────────────────────────
// Mutation (Optimistic)
// ───────────────────────────────────────────────────────

/**
 * 알림 설정 부분 업데이트.
 *
 * 동작:
 *  1) onMutate: 캐시를 즉시 새 값으로 덮어씌움 (UI 즉시 반응)
 *  2) 서버 호출 → 성공 시 그대로, 실패 시 snapshot으로 롤백
 *  3) onSettled: 서버 응답으로 invalidate해서 최종 동기화
 */
export function useUpdateNotificationPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateNotificationPreferenceRequest) =>
      updateMyNotificationPreference(request),

    onMutate: async (request) => {
      await qc.cancelQueries({ queryKey: notificationPreferenceKeys.all });
      const snapshot = qc.getQueryData<NotificationPreference>(
        notificationPreferenceKeys.detail(),
      );

      // null이 아닌 필드만 덮어쓰기 (PATCH 의미 그대로)
      qc.setQueryData<NotificationPreference>(
        notificationPreferenceKeys.detail(),
        (prev) =>
          prev
            ? {
                immediateMedicationAlert:
                  request.immediateMedicationAlert ??
                  prev.immediateMedicationAlert,
                dailyDigestEnabled:
                  request.dailyDigestEnabled ?? prev.dailyDigestEnabled,
                dailyDigestTime:
                  request.dailyDigestTime ?? prev.dailyDigestTime,
              }
            : prev,
      );

      return { snapshot };
    },

    onError: (_err, _request, context) => {
      if (context?.snapshot) {
        qc.setQueryData(notificationPreferenceKeys.detail(), context.snapshot);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationPreferenceKeys.all });
    },
  });
}
