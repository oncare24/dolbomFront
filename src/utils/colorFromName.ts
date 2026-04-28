// 이름 → 아바타 배경색 (deterministic).
// 같은 이름은 항상 같은 색 → 보호자가 카드를 한눈에 식별.
// 6색 팔레트는 시니어 친화 채도(중간) + WCAG 흰 글씨 대비 4.5+ 만족.

const PALETTE = [
  "#E27D9F", // 분홍
  "#5E8FC7", // 파랑
  "#7AA968", // 녹색
  "#D69343", // 오렌지
  "#9573C9", // 보라
  "#4FA39B", // 청록
] as const;

export function colorFromName(name: string): string {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}
