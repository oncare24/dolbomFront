// 회원가입 입력 검증 스키마.
// react-hook-form + @hookform/resolvers/zod 와 함께 사용.
// 단계별 검증을 위해 step별 sub-schema 분리. 마지막 submit 시 full schema로 한 번 더 검증.

import { z } from "zod";

// 한국 휴대폰 번호: 010-XXXX-XXXX (하이픈 포함 13자)
const phoneRegex = /^010-\d{4}-\d{4}$/;

// 비밀번호 정책: 4자리 숫자 (시니어 진입장벽 낮추기 위함, PIN 방식).
// 메모리상 테스트 계정 비밀번호도 4자리("1111", "2222")로 잡혀 있음.
const pinRegex = /^\d{4}$/;

// Step 1: 역할 선택
export const roleSchema = z.object({
  role: z.enum(["elderly", "guardian"], {
    message: "역할을 선택해주세요",
  }),
});

// Step 2: 프로필 (휴대폰 + 이름)
export const profileSchema = z.object({
  phone: z
    .string()
    .min(1, "휴대폰 번호를 입력해주세요")
    .regex(phoneRegex, "010-0000-0000 형식으로 입력해주세요"),
  name: z
    .string()
    .min(1, "이름을 입력해주세요")
    .min(2, "이름은 2자 이상이어야 해요")
    .max(20, "이름은 20자 이하로 입력해주세요"),
});

// Step 3: 비밀번호 (PIN 4자리 + 확인)
export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(1, "비밀번호를 입력해주세요")
      .regex(pinRegex, "숫자 4자리로 입력해주세요"),
    passwordConfirm: z.string().min(1, "비밀번호를 다시 입력해주세요"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않아요",
    path: ["passwordConfirm"],
  });

// 전체 폼 통합 스키마
export const signupSchema = z
  .object({
    role: z.enum(["elderly", "guardian"]),
    phone: z.string().regex(phoneRegex),
    name: z.string().min(2).max(20),
    password: z.string().regex(pinRegex),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않아요",
    path: ["passwordConfirm"],
  });

// 타입 추론 (다른 파일에서 사용)
export type SignupFormValues = z.infer<typeof signupSchema>;
export type UserRole = SignupFormValues["role"];
