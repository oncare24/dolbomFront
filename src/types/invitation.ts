// 보호자-피보호자 초대 도메인 타입.
//
// 백엔드 GuardianWardStatus와 동일한 문자열 (PENDING/ACCEPTED/REJECTED).
// 백엔드가 EnumType.STRING으로 그대로 직렬화하니 변환 불필요.

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

/** 보호자 시점 — 내가 보낸 초대 */
export interface SentInvitation {
  id: number;
  inviteCode: string;
  wardId: number;
  wardName: string;
  wardPhoneMasked: string;
  relationship: string | null;
  status: InvitationStatus;
  expiresAt: string; // ISO datetime
  createdAt: string;
}

/** 피보호자 시점 — 내가 받은 초대 (9-E에서 사용) */
export interface ReceivedInvitation {
  id: number;
  guardianId: number;
  guardianName: string;
  guardianPhoneMasked: string;
  relationship: string | null;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}
