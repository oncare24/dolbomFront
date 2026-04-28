// 초대 보내기 폼 검증 스키마.

import { z } from "zod";

const phoneRegex = /^010-\d{4}-\d{4}$/;

export const inviteSchema = z.object({
  wardPhone: z
    .string()
    .min(1, "어르신 휴대폰 번호를 입력해주세요")
    .regex(phoneRegex, "010-0000-0000 형식으로 입력해주세요"),
  relationship: z
    .string()
    .max(20, "관계는 20자 이내로 입력해주세요")
    .optional(),
});

export type InviteFormValues = z.infer<typeof inviteSchema>;
