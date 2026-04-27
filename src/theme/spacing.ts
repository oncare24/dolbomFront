// 8pt grid 기반 간격 토큰. 4·8·12·16의 배수만 사용.

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16, // 기본 좌우 패딩
  lg: 24, // 섹션 간격(피보호자)
  xl: 32, // 화면 상하 여백(피보호자)
  xxl: 48,
  xxxl: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20, // 큰 카드 (시니어 액션 카드용 — 친근함)
  xxl: 28, // 바텀시트, 풀스크린 모달
  full: 9999,
} as const;

// 화면별 권장 패딩
export const ScreenPadding = {
  elderly: { horizontal: Spacing.lg, vertical: Spacing.xl }, // 24, 32
  guardian: { horizontal: Spacing.md, vertical: Spacing.lg }, // 16, 24
} as const;
