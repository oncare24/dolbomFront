// 인증 흐름 API. 백엔드 ApiResponse는 api.ts 인터셉터에서 unwrap되므로
// 여기서는 data만 받음.
//
// 이 파일에는 토큰을 다루는 흐름만 둠 (signup, login, logout).
// user 정보 조회/수정은 userService.ts.

import { api } from "./api";
import type { UserRole } from "../stores/authStore";
import type { BackendRole } from "./userService";

// ───────────────────────────────────────────────────────
// auth 흐름 전용 헬퍼
// ───────────────────────────────────────────────────────
function toBackendRole(role: UserRole): BackendRole {
  return role === "elderly" ? "ELDER" : "GUARDIAN";
}

function stripPhone(phoneWithHyphens: string): string {
  return phoneWithHyphens.replace(/\D/g, "");
}

// ───────────────────────────────────────────────────────
// DTO
// ───────────────────────────────────────────────────────
export interface SignupRequest {
  phone: string;
  password: string;
  name: string;
  role: UserRole;
  /** ELDER 필수, GUARDIAN 미전송. Graph RAG ELDERLY 판정용. */
  age?: number;
  /** ELDER 필수, GUARDIAN 미전송. Graph RAG PREGNANCY 판정용. */
  isPregnant?: boolean;
}

export interface SignupResponseRaw {
  userId: number;
  phone: string;
  name: string;
  role: BackendRole;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

// ───────────────────────────────────────────────────────
// API
// ───────────────────────────────────────────────────────

/** 회원가입. 성공 시 SignupResponseRaw 반환. */
export async function signup(body: SignupRequest): Promise<SignupResponseRaw> {
  const res = await api.post<SignupResponseRaw>("/api/auth/signup", {
    phone: stripPhone(body.phone),
    password: body.password,
    name: body.name,
    role: toBackendRole(body.role),
    age: body.age,
    isPregnant: body.isPregnant,
  });
  return res.data;
}

/** 로그인. 토큰만 반환 — user 정보는 호출 측에서 userService.getMe()로 조회. */
export async function login(body: LoginRequest): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>("/api/auth/login", {
    phone: stripPhone(body.phone),
    password: body.password,
  });
  return res.data;
}

/** 로그아웃. 서버 쪽 refresh 토큰 무효화 + 클라이언트 store 초기화는 호출 측에서. */
export async function logout(): Promise<void> {
  try {
    await api.post("/api/auth/logout");
  } catch {
    // 토큰이 이미 만료됐어도 클라 정리는 진행해야 하므로 무시
  }
}
