// 색상 토큰. 컴포넌트 내에서 hex 값을 직접 쓰지 않고 이 파일만 import.
// 디자인 시안 확정 시 이 파일만 수정하면 전 화면에 반영됨.

export const Colors = {
  // ─── Brand ───
  brand: {
    primary: "#2D6CDF", // 메인 액션 (잠정)
    primaryDark: "#1E4FA8", // pressed 상태
    primaryLight: "#E8F0FE", // 배경 강조
    secondary: "#FF8A3D", // 보조 액션
  },

  // ─── Semantic (의미 있는 색) ───
  // 모두 흰 배경 대비 7:1 이상(AAA) 만족하는 어두운 톤
  semantic: {
    success: "#1B5E20",
    successBg: "#E8F5E9",
    warning: "#C66200",
    warningBg: "#FFF4E5",
    danger: "#B71C1C",
    dangerBg: "#FDECEC",
    info: "#01579B",
    infoBg: "#E5F4FB",
  },

  // ─── Surface (배경/카드) ───
  surface: {
    background: "#F5F6F8", // 화면 배경 (살짝 회색 — 카드와 대비)
    card: "#FFFFFF", // 카드는 순백 (대비 명확)
    cardElevated: "#FFFFFF",
    divider: "#E5E7EB",
    overlay: "rgba(0,0,0,0.5)",
  },

  // ─── Text ───
  text: {
    primary: "#1A1A1A", // 흰 배경 대비 ~16:1 (AAA)
    secondary: "#4A4A4A", // ~9:1 (AAA)
    disabled: "#8C8C8C",
    inverse: "#FFFFFF",
    link: "#1E4FA8",
  },

  // ─── Gray scale (가급적 사용 자제, 위 토큰 우선) ───
  gray: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },
} as const;
