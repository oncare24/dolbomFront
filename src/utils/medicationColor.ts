// 약 이름 → 구분용 색상. 같은 이름은 항상 같은 색(결정적).
// 텍스트만으론 약이 다 똑같이 보이는 문제를 색 점/아이콘으로 구분하기 위함.
// 흰 배경 대비 충분히 진한 색만 골라 접근성 확보.

const PALETTE = [
  "#2D6CDF", // 파랑 (브랜드)
  "#E8590C", // 주황
  "#2F9E44", // 초록
  "#9C36B5", // 보라
  "#1098AD", // 청록
  "#C2255C", // 자홍
  "#3B5BDB", // 남색
  "#E67700", // 호박
] as const;

/** 약 이름을 결정적으로 팔레트 색에 매핑. 같은 이름 → 항상 같은 색. */
export function medicationColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
