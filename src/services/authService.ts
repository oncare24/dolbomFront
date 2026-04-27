// 인증 관련 API 호출 함수 (Mock 구현).
// 백엔드 연동 시 함수 내부만 axios 호출로 교체. 시그니처 유지.

import type { AuthUser } from "../stores/authStore";

export interface LoginRequest {
  phoneNumber: string; // "010-1234-5678" 형식 (하이픈 포함)
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

// ─── Mock 데이터 ───
// 테스트용 계정 2개 (피보호자 / 보호자)
const MOCK_USERS: Array<{
  phoneNumber: string;
  password: string;
  user: AuthUser;
}> = [
  {
    phoneNumber: "010-1111-1111",
    password: "1111",
    user: {
      id: 1,
      name: "김복자",
      phoneNumber: "010-1111-1111",
      role: "elderly",
    },
  },
  {
    phoneNumber: "010-2222-2222",
    password: "2222",
    user: {
      id: 2,
      name: "박철수",
      phoneNumber: "010-2222-2222",
      role: "guardian",
    },
  },
];

/**
 * 로그인 API (Mock)
 * 실제 동작:
 * - 1초 지연 (실제 네트워크 흉내)
 * - 휴대폰 번호 + 비밀번호 일치 시 → 토큰 + 유저 정보 반환
 * - 불일치 시 → throw Error
 *
 * 백엔드 연동 시:
 * return await axios.post('/api/auth/login', body).then(res => res.data);
 */
export async function login(body: LoginRequest): Promise<LoginResponse> {
  // 네트워크 지연 흉내 (1초)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const matched = MOCK_USERS.find(
    (u) => u.phoneNumber === body.phoneNumber && u.password === body.password,
  );

  if (!matched) {
    throw new Error("휴대폰 번호 또는 비밀번호가 일치하지 않습니다");
  }

  // Mock JWT (실제 백엔드는 진짜 JWT 발급)
  return {
    accessToken: `mock-token-${matched.user.id}-${Date.now()}`,
    user: matched.user,
  };
}

/**
 * 로그아웃 API (Mock)
 * 백엔드 연동 시: 서버에 토큰 무효화 요청
 */
export async function logout(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // 서버 토큰 무효화는 클라이언트 store에서 처리
}
