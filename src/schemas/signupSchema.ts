// front/src/schemas/signupSchema.ts
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

// ★ 통합 스키마 — age / isPregnant 추가, ELDER 한정 필수
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

    // 피보호자 한정 입력. text input → 문자열로 보관, 제출 시 Number 변환.
    age: z.string().optional(),
    // 라디오 선택 전 = undefined. 제출 시 boolean 보장.
    isPregnant: z.boolean().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않아요",
    path: ["passwordConfirm"],
  })
  .superRefine((data, ctx) => {
    if (data.role !== "elderly") return;

    const ageNum = Number(data.age);
    if (!data.age || !Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
      ctx.addIssue({
        path: ["age"],
        code: z.ZodIssueCode.custom,
        message: "나이를 1~120 사이로 입력해주세요",
      });
    }
    if (data.isPregnant === undefined || data.isPregnant === null) {
      ctx.addIssue({
        path: ["isPregnant"],
        code: z.ZodIssueCode.custom,
        message: "임신 여부를 선택해주세요",
      });
    }
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
export type UserRole = SignupFormValues["role"];
