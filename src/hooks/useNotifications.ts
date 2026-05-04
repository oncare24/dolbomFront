// 알림센터 도메인 react-query 훅 모음.
//
// useNotifications: 목록 조회 (최신순)
// useUnreadCount: 안 읽은 개수 (보호자 홈 종 빨간 점)
// useMarkAsRead: 읽음 처리 (Optimistic) — UI 즉시 반응 + 빨간 점 즉시 사라짐
//
// pollingInterval: 폴링은 일부러 안 함. 푸시 알림 도착 시 사용자가
// pull-to-refresh 또는 화면 진입할 때 invalidate되는 흐름이 더 자연스럽고 배터리 친화적.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
} from "../services/notificationCenterService";
import type { NotificationItem, UnreadCount } from "../types/notification";

// ───────────────────────────────────────────────────────
// Query Keys (Factory)
// ───────────────────────────────────────────────────────
export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

// ───────────────────────────────────────────────────────
// Queries
// ───────────────────────────────────────────────────────

/** 내 알림 목록 (최신순). 보호자 알림센터 화면에서 사용. */
export function useNotifications(
  options?: Omit<UseQueryOptions<NotificationItem[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: getMyNotifications,
    ...options,
  });
}

/** 안 읽은 알림 개수. 보호자 홈 종 아이콘 빨간 점에 사용. */
export function useUnreadCount(
  options?: Omit<UseQueryOptions<UnreadCount>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    // 홈 화면 다시 진입할 때 자주 갱신되도록 staleTime 짧게
    staleTime: 30 * 1000, // 30초
    ...options,
  });
}

// ───────────────────────────────────────────────────────
// Mutations
// ───────────────────────────────────────────────────────

/**
 * 알림 읽음 처리. Optimistic Update 적용.
 *
 * 동작:
 *  1) onMutate: list 캐시에서 readAt을 즉시 채움 + unread-count 감소
 *  2) 서버 호출 → 성공 시 그대로 유지, 실패 시 snapshot으로 롤백
 *  3) onSettled: 양쪽 invalidate로 최종 동기화
 */
export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotificationAsRead(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });

      const listSnapshot = qc.getQueryData<NotificationItem[]>(
        notificationKeys.list(),
      );
      const countSnapshot = qc.getQueryData<UnreadCount>(
        notificationKeys.unreadCount(),
      );

      // 리스트 캐시: 해당 알림의 readAt을 현재 시각으로 박음
      qc.setQueryData<NotificationItem[]>(notificationKeys.list(), (prev) =>
        prev
          ? prev.map((n) =>
              n.id === id && n.readAt === null
                ? { ...n, readAt: new Date().toISOString() }
                : n,
            )
          : prev,
      );

      // 미확인 개수 캐시: 1 감소 (이미 읽은 알림 다시 클릭하는 idempotent 케이스 방어)
      const wasUnread = listSnapshot?.find((n) => n.id === id)?.readAt === null;
      if (wasUnread) {
        qc.setQueryData<UnreadCount>(notificationKeys.unreadCount(), (prev) =>
          prev ? { count: Math.max(0, prev.count - 1) } : prev,
        );
      }

      return { listSnapshot, countSnapshot };
    },

    onError: (_err, _id, context) => {
      if (context?.listSnapshot) {
        qc.setQueryData(notificationKeys.list(), context.listSnapshot);
      }
      if (context?.countSnapshot) {
        qc.setQueryData(notificationKeys.unreadCount(), context.countSnapshot);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
