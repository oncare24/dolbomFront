// 상대 시간 포맷터.
// 분 단위 → "방금 전" / "5분 전" / "1시간 전" / "어제" / "3일 전" / "2주 전"
// null 입력은 "—" — 한 번도 보고 없는 어르신 표시용 (백엔드 lastReportedMinutesAgo nullable)

export function formatRelativeMinutes(
  minutesAgo: number | null | undefined,
): string {
  if (minutesAgo == null) return "—";
  if (minutesAgo < 1) return "방금 전";
  if (minutesAgo < 60) return `${Math.floor(minutesAgo)}분 전`;

  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 2) return "어제";
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}
