// 피보호자 홈 도메인 타입.

import { Ionicons } from "@expo/vector-icons";

export type IoniconName = keyof typeof Ionicons.glyphMap;

// 메인 액션 3개 (병원찾기와 길안내는 한 흐름이라 통합)
export type ElderlyHomeAction = "sos" | "hospital" | "medication";

// 오늘의 복약 상태
export interface MedicationStatus {
  totalCount: number; // 오늘 총 복용 횟수
  takenCount: number; // 이미 복용한 횟수
  nextTime: string | null; // 다음 복용 시각 ("12:30") / null이면 모두 완료
  nextLabel: string | null; // 다음 복용 라벨 ("점심 약") / null이면 모두 완료
  nextIsOverdue?: boolean; // 보여줄 약이 지난(놓친) 회차면 true
}

// 안전구역 상태
export interface SafeZoneStatus {
  isInside: boolean; // 안전구역 안인지
  currentLabel: string; // "집 근처" / "OO 지역" 등
}
