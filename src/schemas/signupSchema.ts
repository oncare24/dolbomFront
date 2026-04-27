// 회원가입 입력 검증 스키마.
// react-hook-form + @hookform/resolvers/zod 와 함께 사용.

import { z } from "zod";

const phoneRegex = /^010-\d{4}-\d{4}$/;
const pinRegex = /^\d{6}$/;

export const roleSchema = z.object({
  role: z.enum(["elderly", "guardian"], {
    message: "역할을 선택해주세요",
  }),
});

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

export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(1, "비밀번호를 입력해주세요")
      .regex(pinRegex, "숫자 6자리로 입력해주세요"),
    passwordConfirm: z.string().min(1, "비밀번호를 다시 입력해주세요"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않아요",
    path: ["passwordConfirm"],
  });

// ★ 통합 스키마 — 모든 필드에 한글 메시지 추가
export const signupSchema = z
  .object({
    role: z.enum(["elderly", "guardian"], {
      message: "역할을 선택해주세요",
    }),
    phone: z
      .string()
      .min(1, "휴대폰 번호를 입력해주세요")
      .regex(phoneRegex, "010-0000-0000 형식으로 입력해주세요"),
    name: z
      .string()
      .min(1, "이름을 입력해주세요")
      .min(2, "이름은 2자 이상이어야 해요")
      .max(20, "이름은 20자 이하로 입력해주세요"),
    password: z
      .string()
      .min(1, "비밀번호를 입력해주세요")
      .regex(pinRegex, "숫자 6자리로 입력해주세요"),
    passwordConfirm: z.string().min(1, "비밀번호를 다시 입력해주세요"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않아요",
    path: ["passwordConfirm"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
export type UserRole = SignupFormValues["role"];
