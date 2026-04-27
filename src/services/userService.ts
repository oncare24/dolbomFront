// User 도메인 API 함수 모음.
// authService에서 getMe를 분리해서 user 정보 조회/수정은 여기에 모음.
//
// 향후 추가될 함수: updateMyProfile, updateFcmToken, deleteMyAccount 등.

import { api } from "./api";
import type { AuthUser, UserRole } from "../stores/authStore";

// ───────────────────────────────────────────────────────
// 백엔드 ↔ 프론트 변환 (user 도메인의 공통 타입/헬퍼)
// authService도 SignupResponse 등에서 BackendRole 사용 → 여기서 export
// ───────────────────────────────────────────────────────
export type BackendRole = "ELDER" | "GUARDIAN";

export function toFrontRole(role: BackendRole): UserRole {
  return role === "ELDER" ? "elderly" : "guardian";
}

/** 백엔드 phone(01012345678) → 프론트 표시 형식(010-1234-5678) */
export function formatPhone(digitsOnly: string): string {
  if (digitsOnly.length !== 11) return digitsOnly;
  return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
}

// ───────────────────────────────────────────────────────
// DTO
// ───────────────────────────────────────────────────────
export interface UserMeResponseRaw {
  userId: number;
  phone: string;
  name: string;
  role: BackendRole;
  email: string | null;
  phoneVerified: boolean;
}

// ───────────────────────────────────────────────────────
// API
// ───────────────────────────────────────────────────────

/** 내 정보 조회. AuthUser 형태로 변환해서 반환. */
export async function getMe(): Promise<AuthUser> {
  const res = await api.get<UserMeResponseRaw>("/api/users/me");
  const u = res.data;
  return {
    id: u.userId,
    name: u.name,
    phoneNumber: formatPhone(u.phone),
    role: toFrontRole(u.role),
  };
}
