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

// 시각 → 시간대 라벨(화면 슬롯 제목용). 식사 시간 구간만 식사명, 그 외는 오후/밤.
// getMealLabel(정확한 봉지 시각)과 달리 모든 시각을 합리적 구간으로 분류.
//   5~10 아침 · 11~13 점심 · 14~16 오후 · 17~20 저녁 · 그 외(21~4) 밤
export function timeSlotLabel(time: string): string {
  const hour = parseInt(time, 10);
  if (hour >= 5 && hour <= 10) return "아침";
  if (hour >= 11 && hour <= 13) return "점심";
  if (hour >= 14 && hour <= 16) return "오후";
  if (hour >= 17 && hour <= 20) return "저녁";
  return "밤";
}
