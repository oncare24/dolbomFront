// src/utils/mealLabel.ts
// 시각 → 봉지 라벨. CODEF 자동등록 기본 시각(8/13/19/22)만 매핑.
// 그 외 시각(수동 약 등)은 null → 호출부에서 약 이름으로 fallback.
export function getMealLabel(time: string): string | null {
  const hour = parseInt(time, 10); // "08:00" / "08:00:00" → 8
  if (hour === 8) return "아침약";
  if (hour === 13) return "점심약";
  if (hour === 19) return "저녁약";
  if (hour === 22) return "밤약";
  return null;
}
