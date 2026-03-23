// ============================================================
// Haversine 거리 계산
// ============================================================
// 두 GPS 좌표 사이의 실제 거리(미터)를 구하는 공식
// 사용처: 카드 전환 판정(20m), 경로 이탈 감지(50m), 서버 지오펜싱

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** 두 GPS 좌표 사이 거리 (미터) */
export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * centralAngle;
}

/** 현재 위치 → 경로(좌표 배열)까지 최소 거리 (경로 이탈 감지용) */
export function distanceToPath(
  currentLat: number,
  currentLon: number,
  pathCoords: { latitude: number; longitude: number }[],
): number {
  if (pathCoords.length === 0) return Infinity;

  let minDistance = Infinity;
  for (const coord of pathCoords) {
    const d = haversine(
      currentLat,
      currentLon,
      coord.latitude,
      coord.longitude,
    );
    if (d < minDistance) minDistance = d;
  }
  return minDistance;
}

/** 거리 → "1.5km" 또는 "200m" */
export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
}

/** 시간(초) → "약 5분" 또는 "약 1시간 20분" */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}초`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `약 ${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const remainMin = minutes % 60;
  return remainMin > 0 ? `약 ${hours}시간 ${remainMin}분` : `약 ${hours}시간`;
}
