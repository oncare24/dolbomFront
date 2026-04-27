// 타이포그래피 토큰.
// elderly: 본문 18sp, letterSpacing +0.2 (한글 자간 보정 — 시니어 가독성 ↑)
// guardian: 본문 16sp, letterSpacing 0

export const Typography = {
  elderly: {
    display: {
      fontSize: 32,
      lineHeight: 44,
      fontWeight: "700" as const,
      letterSpacing: 0.2,
    },
    h1: {
      fontSize: 28,
      lineHeight: 38,
      fontWeight: "700" as const,
      letterSpacing: 0.2,
    },
    h2: {
      fontSize: 24,
      lineHeight: 34,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
    },
    h3: {
      fontSize: 20,
      lineHeight: 30,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
    },
    body: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: "400" as const,
      letterSpacing: 0.2,
    },
    bodyBold: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
    },
    caption: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "400" as const,
      letterSpacing: 0.2,
    },
  },
  guardian: {
    display: {
      fontSize: 28,
      lineHeight: 38,
      fontWeight: "700" as const,
      letterSpacing: 0,
    },
    h1: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "700" as const,
      letterSpacing: 0,
    },
    h2: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "600" as const,
      letterSpacing: 0,
    },
    h3: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "600" as const,
      letterSpacing: 0,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "400" as const,
      letterSpacing: 0,
    },
    bodyBold: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "600" as const,
      letterSpacing: 0,
    },
    caption: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "400" as const,
      letterSpacing: 0,
    },
  },
} as const;

export type TypographyVariant = keyof typeof Typography.elderly;
export type TypographyAudience = keyof typeof Typography;
