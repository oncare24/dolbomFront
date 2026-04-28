// 초대 도메인 react-query 훅 모음.
//
// 9-D 범위: useSentInvitations, useCreateInvitation, useCancelInvitation
// 9-E 범위: useReceivedInvitations, useAcceptInvitation, useRejectInvitation

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  acceptInvitation,
  cancelInvitation,
  createInvitation,
  getReceivedInvitations,
  getSentInvitations,
  rejectInvitation,
  type CreateInvitationInput,
} from "../services/invitationService";
import type { ReceivedInvitation, SentInvitation } from "../types/invitation";

// ───────────────────────────────────────────────────────
// Query Keys (Factory)
// ───────────────────────────────────────────────────────
export const invitationKeys = {
  all: ["invitations"] as const,
  sent: () => [...invitationKeys.all, "sent"] as const,
  received: () => [...invitationKeys.all, "received"] as const,
};

// ───────────────────────────────────────────────────────
// Queries
// ───────────────────────────────────────────────────────

/** 보호자 시점 — 내가 보낸 PENDING 초대 목록 */
export function useSentInvitations(
  options?: Omit<UseQueryOptions<SentInvitation[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: invitationKeys.sent(),
    queryFn: getSentInvitations,
    ...options,
  });
}

/** 피보호자 시점 — 받은 PENDING 초대 목록 (9-E에서 사용) */
export function useReceivedInvitations(
  options?: Omit<UseQueryOptions<ReceivedInvitation[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: invitationKeys.received(),
    queryFn: getReceivedInvitations,
    ...options,
  });
}

// ───────────────────────────────────────────────────────
// Mutations
// ───────────────────────────────────────────────────────

/** 초대 생성. 성공 시 sent 목록 invalidate. */
export function useCreateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvitationInput) => createInvitation(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationKeys.sent() });
    },
  });
}

/** 초대 취소. Optimistic Update 적용 — UI 즉각 반응. */
export function useCancelInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelInvitation(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: invitationKeys.sent() });
      const snapshot = qc.getQueryData<SentInvitation[]>(invitationKeys.sent());
      qc.setQueryData<SentInvitation[]>(invitationKeys.sent(), (prev) =>
        prev ? prev.filter((inv) => inv.id !== id) : prev,
      );
      return { snapshot };
    },

    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        qc.setQueryData(invitationKeys.sent(), context.snapshot);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: invitationKeys.sent() });
    },
  });
}

/** 9-E에서 사용: 받은 초대 수락 */
export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => acceptInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationKeys.received() });
    },
  });
}

/** 9-E에서 사용: 받은 초대 거절 */
export function useRejectInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rejectInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationKeys.received() });
    },
  });
}
