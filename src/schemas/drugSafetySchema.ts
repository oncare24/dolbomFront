// 처방전 카카오톡 간편인증 입력 폼 validation.
//
// 보안 원칙:
//  - useState/useForm 메모리에만 보관.
//  - AsyncStorage / SecureStore 절대 X.
//  - 결과 화면 도착 후 / 화면 unmount 시 폐기.

import { z } from "zod";

const KOREAN_NAME_REGEX = /^[가-힣]{2,10}$/;

export const codefAuthSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(1, "이름을 입력해 주세요.")
    .regex(KOREAN_NAME_REGEX, "한글 이름 2~10자로 입력해 주세요."),

  identity: z
    .string()
    .trim()
    .transform((s) => s.replace(/[^\d]/g, ""))
    .pipe(
      z.string().regex(/^\d{13}$/, "주민등록번호 13자리 숫자를 입력해 주세요."),
    ),

  phoneNo: z
    .string()
    .trim()
    .transform((s) => s.replace(/[^\d]/g, ""))
    .pipe(
      z.string().regex(/^\d{10,11}$/, "휴대폰 번호 10~11자리를 입력해 주세요."),
    ),
});

export type CodefAuthFormValues = z.infer<typeof codefAuthSchema>;
