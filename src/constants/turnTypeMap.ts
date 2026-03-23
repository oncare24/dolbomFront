// ============================================================
// Tmap turnType 매핑
// ============================================================
// turnType 숫자 → 한글 라벨 + 아이콘 변환

interface TurnTypeInfo {
  label: string;
  icon: string;
  category: "start" | "end" | "turn" | "crosswalk" | "facility" | "straight";
}

const TURN_TYPE_MAP: Record<number, TurnTypeInfo> = {
  // 출발/도착
  200: { label: "출발", icon: "🏁", category: "start" },
  201: { label: "도착", icon: "📍", category: "end" },

  // 직진
  11: { label: "직진", icon: "↑", category: "straight" },

  // 회전
  12: { label: "좌회전", icon: "↰", category: "turn" },
  13: { label: "우회전", icon: "↱", category: "turn" },
  14: { label: "유턴", icon: "↶", category: "turn" },
  16: { label: "8시 방향", icon: "↙", category: "turn" },
  17: { label: "10시 방향", icon: "↖", category: "turn" },
  18: { label: "2시 방향", icon: "↗", category: "turn" },
  19: { label: "4시 방향", icon: "↘", category: "turn" },

  // 횡단보도
  211: { label: "횡단보도", icon: "🚶", category: "crosswalk" },
  212: { label: "좌측 횡단보도", icon: "🚶", category: "crosswalk" },
  213: { label: "우측 횡단보도", icon: "🚶", category: "crosswalk" },
  214: { label: "8시방향 횡단보도", icon: "🚶", category: "crosswalk" },
  215: { label: "10시방향 횡단보도", icon: "🚶", category: "crosswalk" },
  216: { label: "2시방향 횡단보도", icon: "🚶", category: "crosswalk" },
  217: { label: "4시방향 횡단보도", icon: "🚶", category: "crosswalk" },
  233: { label: "직진 횡단보도", icon: "🚶", category: "crosswalk" },

  // 시설물
  125: { label: "육교", icon: "🌉", category: "facility" },
  126: { label: "지하보도", icon: "🚇", category: "facility" },
  127: { label: "계단 진입", icon: "🪜", category: "facility" },
  128: { label: "경사로 진입", icon: "⬈", category: "facility" },
  218: { label: "엘리베이터", icon: "🛗", category: "facility" },
};

export function getTurnLabel(turnType: number): string {
  return TURN_TYPE_MAP[turnType]?.label ?? `안내(${turnType})`;
}

export function getTurnIcon(turnType: number): string {
  return TURN_TYPE_MAP[turnType]?.icon ?? "•";
}

export function getTurnTypeInfo(turnType: number): TurnTypeInfo {
  return (
    TURN_TYPE_MAP[turnType] ?? {
      label: `안내(${turnType})`,
      icon: "•",
      category: "straight" as const,
    }
  );
}

export function parsePointType(
  pointType: string,
): "start" | "end" | "waypoint" | "normal" {
  switch (pointType) {
    case "SP":
      return "start";
    case "EP":
      return "end";
    case "GP":
      return "waypoint";
    default:
      return "normal";
  }
}
