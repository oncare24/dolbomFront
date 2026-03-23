// ============================================================
// Tmap 보행자 API 응답 → NavigationCard[] 변환
// ============================================================
// 핵심: Point(안내정보) + 바로 다음 LineString(경로좌표) = 카드 1장
// 좌표: [경도, 위도] → { latitude, longitude } 뒤집기 필수!

import type {
  TmapResponse,
  TmapFeature,
  TmapPointFeature,
  TmapLineStringFeature,
  NavigationCard,
  NavigationRoute,
} from "../types/navigation";
import { getTurnLabel, parsePointType } from "../constants/turnTypeMap";

// ── 타입 가드 ──

function isPointFeature(f: TmapFeature): f is TmapPointFeature {
  return f.geometry.type === "Point";
}

function isLineStringFeature(f: TmapFeature): f is TmapLineStringFeature {
  return f.geometry.type === "LineString";
}

// ── 좌표 변환 ──

/** [경도, 위도] → { latitude, longitude } */
function flipCoord(coord: [number, number]) {
  return { latitude: coord[1], longitude: coord[0] };
}

function flipCoords(coords: [number, number][]) {
  return coords.map(flipCoord);
}

// ── 메인 파서 ──

/**
 * Tmap 보행자 API 응답 → NavigationRoute
 *
 * 동작:
 * 1. features 순회하면서 Point 만나면 카드 생성 시작
 * 2. 바로 다음 LineString에서 경로좌표/거리/시간 가져와서 합침
 * 3. 마지막 Point(도착지)는 LineString 없으므로 빈 경로
 */
export function parseTmapResponse(response: TmapResponse): NavigationRoute {
  const { features } = response;
  const cards: NavigationCard[] = [];
  const fullPath: { latitude: number; longitude: number }[] = [];

  let totalDistance = 0;
  let totalDuration = 0;
  let cardIndex = 0;

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    if (!isPointFeature(feature)) continue;

    const point = feature;
    const pointCoord = flipCoord(point.geometry.coordinates);

    // 바로 다음 LineString 찾기
    let pathCoords: { latitude: number; longitude: number }[] = [];
    let distance = 0;
    let duration = 0;

    const nextFeature = i + 1 < features.length ? features[i + 1] : null;
    if (nextFeature && isLineStringFeature(nextFeature)) {
      pathCoords = flipCoords(nextFeature.geometry.coordinates);
      distance = nextFeature.properties.distance;
      duration = nextFeature.properties.time;
      fullPath.push(...pathCoords);
      totalDistance += distance;
      totalDuration += duration;
    }

    cards.push({
      index: cardIndex,
      point: pointCoord,
      turnType: point.properties.turnType,
      turnLabel: getTurnLabel(point.properties.turnType),
      description: point.properties.description,
      name: point.properties.name || point.properties.intersectionName || "",
      pathCoords,
      distance,
      duration,
      pointType: parsePointType(point.properties.pointType),
    });

    cardIndex++;
  }

  return { cards, fullPath, totalDistance, totalDuration };
}

/** 디버깅용 — 콘솔에 카드 배열 출력 */
export function logCards(cards: NavigationCard[]): void {
  console.log(`\n=== 카드 길안내 (${cards.length}장) ===`);
  cards.forEach((card) => {
    const dist = card.distance > 0 ? `${card.distance}m` : "-";
    console.log(
      `[${card.index}] ${card.turnLabel} | ${card.description} | ${dist} | ` +
        `(${card.point.latitude.toFixed(5)}, ${card.point.longitude.toFixed(5)})`,
    );
  });
}
