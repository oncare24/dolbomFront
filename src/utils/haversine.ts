// ============================================================
// Haversine 거리 계산 + 점-선분 최단거리
// ============================================================
// 사용처: 카드 전환 판정, 경로 이탈 감지, 서버 지오펜싱

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

/**
 * 현재 위치 → 경로(좌표 배열)까지 최소 거리 (경로 이탈 감지용).
 *
 * 경로는 연속된 선분들의 집합 — 각 선분과의 최단거리 중 최솟값.
 * 점-점 거리만 쓰면 좌표가 듬성듬성한 긴 직선 구간에서 오판.
 */
export function distanceToPath(
  currentLat: number,
  currentLon: number,
  pathCoords: { latitude: number; longitude: number }[],
): number {
  if (pathCoords.length === 0) return Infinity;
  if (pathCoords.length === 1) {
    return haversine(
      currentLat,
      currentLon,
      pathCoords[0].latitude,
      pathCoords[0].longitude,
    );
  }

  let minDistance = Infinity;
  for (let i = 0; i < pathCoords.length - 1; i++) {
    const d = pointToSegmentDistance(
      currentLat,
      currentLon,
      pathCoords[i].latitude,
      pathCoords[i].longitude,
      pathCoords[i + 1].latitude,
      pathCoords[i + 1].longitude,
    );
    if (d < minDistance) minDistance = d;
  }
  return minDistance;
}

/**
 * 점 P와 선분 AB의 최단거리.
 *
 * Equirectangular 근사로 평면 좌표계에서 사영(projection) → t를 [0,1] 클램프
 * → 가장 가까운 점을 Haversine으로 실제 거리 변환.
 * 짧은 거리(<수 km)에서 충분히 정확.
 */
function pointToSegmentDistance(
  pLat: number,
  pLon: number,
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const meanLatRad = ((aLat + bLat) / 2) * (Math.PI / 180);
  const cosLat = Math.cos(meanLatRad);

  // 평면 좌표 변환 (경도에 cos(lat) 보정)
  const ax = aLon * cosLat;
  const ay = aLat;
  const bx = bLon * cosLat;
  const by = bLat;
  const px = pLon * cosLat;
  const py = pLat;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  let t: number;
  if (lenSq === 0) {
    t = 0; // A == B (퇴화 선분)
  } else {
    t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
  }

  // 선분 위의 가장 가까운 점
  const closestLat = ay + t * dy;
  const closestLon = (ax + t * dx) / cosLat;

  return haversine(pLat, pLon, closestLat, closestLon);
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
