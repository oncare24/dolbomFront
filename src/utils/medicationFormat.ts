// src/utils/medicationFormat.ts

// 시니어 친화 시간 표기 (한국어).
// 24시간제는 시니어 가독성 ↓ → 12시간제 + 자연어 시간대.
// 분 0이면 분 생략 ("오전 8시"), 그 외 "오전 8시 30분".
//
// 시간대 구분 (KRDS 자연어 + 토스 큰글씨 패턴):
//   0~11시: 오전 (단, 0시 → "오전 12시")
//   12시:    낮
//   13~17시: 오후
//   18~23시: 저녁

/** "HH:mm" → 한글 시간. 예: "08:00" → "오전 8시", "18:30" → "저녁 6시 30분". */
export function toKoreanTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);

  let period: string;
  let displayHour: number;

  if (h === 0) {
    period = "오전";
    displayHour = 12;
  } else if (h < 12) {
    period = "오전";
    displayHour = h;
  } else if (h === 12) {
    period = "낮";
    displayHour = 12;
  } else if (h < 18) {
    period = "오후";
    displayHour = h - 12;
  } else {
    period = "저녁";
    displayHour = h - 12;
  }

  if (m === 0) return `${period} ${displayHour}시`;
  return `${period} ${displayHour}시 ${m}분`;
}
