// 터치 타깃 최소 크기 토큰.
// 근거:
// - WCAG 2.5.5 Target Size (Level AAA): 44x44 CSS px
// - Material Design: 48dp 최소, 56dp 권장
// - 행안부「모바일 전자정부 서비스 UI 설계 지침」: 시니어 대상 60dp 이상 권장
// - 한국지능정보사회진흥원「고령자 모바일 앱 접근성 가이드」: 60~80dp

export const Touch = {
  minTarget: 48, // 절대 최소값
  comfortable: 56, // 일반 성인(보호자) 권장
  senior: 72, // 시니어(피보호자) 화면 기본
} as const;
