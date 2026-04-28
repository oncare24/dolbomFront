// 보호자-피보호자 초대 도메인 API.
//
// 백엔드 ApiResponse는 api.ts 인터셉터에서 unwrap되므로 여기서는 data만 받음.
// 폰번호는 axios 단에서 하이픈 제거 후 백엔드 전송 (authService 패턴 동일).

import { api } from "./api";
import type { ReceivedInvitation, SentInvitation } from "../types/invitation";

function stripPhone(phoneWithHyphens: string): string {
  return phoneWithHyphens.replace(/\D/g, "");
}

// ───────────────────────────────────────────────────────
// Request DTO
// ───────────────────────────────────────────────────────
export interface CreateInvitationInput {
  wardPhone: string; // "010-1234-5678" 또는 "01012345678" 모두 OK
  relationship?: string;
}

// ───────────────────────────────────────────────────────
// API
// ───────────────────────────────────────────────────────

/** POST /api/invitations — 보호자가 어르신에게 초대 발송 */
export async function createInvitation(
  input: CreateInvitationInput,
): Promise<SentInvitation> {
  const res = await api.post<SentInvitation>("/api/invitations", {
    wardPhone: stripPhone(input.wardPhone),
    relationship: input.relationship?.trim() || null,
  });
  return res.data;
}

/** GET /api/invitations/sent — 내가 보낸 PENDING 초대 목록 */
export async function getSentInvitations(): Promise<SentInvitation[]> {
  const res = await api.get<SentInvitation[]>("/api/invitations/sent");
  return res.data;
}

/** DELETE /api/invitations/{id} — 보낸 초대 취소 (hard delete) */
export async function cancelInvitation(id: number): Promise<void> {
  await api.delete(`/api/invitations/${id}`);
}

// ───────────────────────────────────────────────────────
// 9-E에서 추가 예정 (받은 초대)
// ───────────────────────────────────────────────────────

/** GET /api/invitations/received — 피보호자가 받은 PENDING 초대 목록 */
export async function getReceivedInvitations(): Promise<ReceivedInvitation[]> {
  const res = await api.get<ReceivedInvitation[]>("/api/invitations/received");
  return res.data;
}

/** POST /api/invitations/{id}/accept */
export async function acceptInvitation(
  id: number,
): Promise<ReceivedInvitation> {
  const res = await api.post<ReceivedInvitation>(
    `/api/invitations/${id}/accept`,
  );
  return res.data;
}

/** POST /api/invitations/{id}/reject */
export async function rejectInvitation(id: number): Promise<void> {
  await api.post(`/api/invitations/${id}/reject`);
}
