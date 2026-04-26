// 타이포그래피 토큰.
// elderly: 피보호자 화면 기본 (본문 18sp).
// guardian: 보호자 화면 기본 (본문 16sp). 보호자 작업 시점에 미세 조정 예정.

export const Typography = {
  elderly: {
    display: { fontSize: 32, lineHeight: 44, fontWeight: "700" as const },
    h1: { fontSize: 28, lineHeight: 38, fontWeight: "700" as const },
    h2: { fontSize: 24, lineHeight: 34, fontWeight: "600" as const },
    h3: { fontSize: 20, lineHeight: 30, fontWeight: "600" as const },
    body: { fontSize: 18, lineHeight: 28, fontWeight: "400" as const },
    bodyBold: { fontSize: 18, lineHeight: 28, fontWeight: "600" as const },
    caption: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  },
  guardian: {
    display: { fontSize: 28, lineHeight: 38, fontWeight: "700" as const },
    h1: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const },
    h2: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const },
    h3: { fontSize: 18, lineHeight: 26, fontWeight: "600" as const },
    body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
    bodyBold: { fontSize: 16, lineHeight: 24, fontWeight: "600" as const },
    caption: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  },
} as const;

export type TypographyVariant = keyof typeof Typography.elderly;
export type TypographyAudience = keyof typeof Typography;
