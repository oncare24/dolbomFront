// 백엔드 NavigationCard[] → 친구 NavigationScreen이 기대하는 TmapResponse(GeoJSON).
//
// 친구가 만든 NavigationScreen은 Tmap 원본 GeoJSON FeatureCollection을 prop으로 받아
// parseTmapResponse(tmapResponse) 로 카드 배열을 만든다.
//
// 변환 전략:
//   1. 백엔드 카드의 path 필드가 있으면 그걸 LineString feature로 사용 (실제 도로 좌표)
//   2. path가 없으면 [이전 카드 끝점, 다음 카드 시작점] 직선으로 채움
//
// 왜 이렇게? 이전 버전은 출발↔도착 사이를 카드 개수로 균등 분할한 fallbackCoords를
// 사용했는데, 이 직선이 실제 BUS 경로와 어긋나서 폴리라인이 산/강을 가로지르며
// 마구잡이로 튀었다. 인접 카드 좌표로 채우면 도보 구간이 자연스러운 직선이 된다.

import type {
  TmapFeature,
  TmapResponse,
  TmapPointFeature,
  TmapLineStringFeature,
} from "../types/tmap";
import type { BackendNavigationCard } from "../services/navigationService";

interface AdapterContext {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  totalDistance: number;
  totalTime: number;
}

/**
 * 백엔드 카드를 type별 turnType 코드로 매핑.
 */
function cardTypeToTurnType(type: BackendNavigationCard["type"]): number {
  switch (type) {
    case "START":
      return 200;
    case "ARRIVAL":
      return 201;
    case "TURN_LEFT":
      return 12;
    case "TURN_RIGHT":
      return 13;
    case "TURN_BACK":
      return 14;
    case "CROSSWALK":
      return 211;
    case "CROSSWALK_LEFT":
      return 212;
    case "CROSSWALK_RIGHT":
      return 213;
    case "STRAIGHT":
    case "WALK":
      return 11;
    case "BUS":
    case "SUBWAY":
      return 11;
    default:
      return 11;
  }
}

/** 카드의 path가 있으면 마지막 좌표 반환. 없으면 null. */
function pathLast(card: BackendNavigationCard): [number, number] | null {
  if (card.path && card.path.length > 0) {
    const last = card.path[card.path.length - 1];
    return [last[0], last[1]];
  }
  return null;
}

/** 카드의 path가 있으면 첫 좌표 반환. 없으면 null. */
function pathFirst(card: BackendNavigationCard): [number, number] | null {
  if (card.path && card.path.length > 0) {
    const first = card.path[0];
    return [first[0], first[1]];
  }
  return null;
}

/**
 * idx 카드의 시작점을 찾는다.
 * - 0번이면 출발지
 * - 마지막이면 도착지
 * - path 있으면 path[0]
 * - path 없으면 이전 카드의 끝점을 재귀로 탐색
 */
function findCardStart(
  cards: BackendNavigationCard[],
  idx: number,
  ctx: AdapterContext,
): [number, number] {
  if (idx <= 0) return [ctx.startLon, ctx.startLat];
  if (idx >= cards.length - 1) return [ctx.endLon, ctx.endLat];

  const own = pathFirst(cards[idx]);
  if (own) return own;

  // path 없는 카드: 이전 카드의 끝점 = 이 카드의 시작점
  return findCardEnd(cards, idx - 1, ctx);
}

/**
 * idx 카드의 끝점을 찾는다.
 * - 0번이면 출발지 (사실상 사용 안 됨)
 * - 마지막이면 도착지
 * - path 있으면 path[last]
 * - path 없으면 다음 카드의 시작점을 재귀로 탐색
 */
function findCardEnd(
  cards: BackendNavigationCard[],
  idx: number,
  ctx: AdapterContext,
): [number, number] {
  if (idx <= 0 && (!cards[0] || !cards[0].path || cards[0].path.length === 0)) {
    return [ctx.startLon, ctx.startLat];
  }
  if (idx >= cards.length - 1) return [ctx.endLon, ctx.endLat];

  const own = pathLast(cards[idx]);
  if (own) return own;

  // path 없는 카드: 다음 카드의 시작점 = 이 카드의 끝점
  return findCardStart(cards, idx + 1, ctx);
}

/**
 * 각 카드의 effective path 계산.
 * - path 있는 카드: 그대로
 * - path 없는 카드: [이전 카드 끝점, 다음 카드 시작점] 직선
 */
function computeEffectivePaths(
  cards: BackendNavigationCard[],
  ctx: AdapterContext,
): [number, number][][] {
  const result: [number, number][][] = [];
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (card.path && card.path.length > 0) {
      result.push(card.path.map((p) => [p[0], p[1]] as [number, number]));
      continue;
    }
    // 빈 path: 이 카드 시작점 = 이전 카드 끝점, 끝점 = 다음 카드 시작점
    let start: [number, number];
    if (i === 0) {
      start = [ctx.startLon, ctx.startLat];
    } else {
      start = findCardEnd(cards, i - 1, ctx);
    }
    let end: [number, number];
    if (i === cards.length - 1) {
      end = [ctx.endLon, ctx.endLat];
    } else {
      end = findCardStart(cards, i + 1, ctx);
    }
    result.push([start, end]);
  }
  return result;
}

/**
 * 백엔드 카드 리스트를 GeoJSON 형식으로 변환.
 *
 * - 모든 카드의 effective path를 먼저 계산 (빈 path는 인접 카드 좌표로 채움)
 * - 각 카드: Point feature (effective path[0]) + LineString feature (effective path 전체)
 */
export function backendCardsToTmapResponse(
  cards: BackendNavigationCard[],
  ctx: AdapterContext,
): TmapResponse {
  const features: TmapFeature[] = [];

  if (cards.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }

  // 모든 카드의 effective path 계산
  const effectivePaths = computeEffectivePaths(cards, ctx);

  let pointIndex = 0;
  let lineIndex = 0;
  let featureIndex = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const isFirst = i === 0;
    const isLast = i === cards.length - 1;
    const effPath = effectivePaths[i];

    // 카드 시작 좌표 (마커 위치)
    let pointCoord: [number, number];
    if (isFirst) {
      pointCoord = [ctx.startLon, ctx.startLat];
    } else if (isLast) {
      pointCoord = [ctx.endLon, ctx.endLat];
    } else {
      // effective path의 첫 좌표 사용 (빈 path였으면 이전 카드 끝점이 들어감)
      pointCoord = effPath[0];
    }

    // Point feature
    const point: TmapPointFeature = {
      type: "Feature",
      geometry: { type: "Point", coordinates: pointCoord },
      properties: {
        index: featureIndex++,
        pointIndex: pointIndex++,
        name: getCardName(card),
        description: card.instruction,
        turnType: cardTypeToTurnType(card.type),
        facilityName: card.facilityName,
        nearPoiName: card.nearPoiName,
        ...(card.type === "START" ? { pointType: "SP" } : {}),
        ...(card.type === "ARRIVAL" ? { pointType: "EP" } : {}),
        ...(isFirst
          ? {
              totalDistance: ctx.totalDistance,
              totalTime: ctx.totalTime,
            }
          : {}),
      },
    };
    features.push(point);

    // LineString feature (마지막 카드 제외)
    // effective path를 그대로 사용. 빈 path는 [start, end] 2점 짜리.
    if (!isLast && effPath.length >= 2) {
      // zero-length 라인은 건너뜀 (start == end인 경우)
      const first = effPath[0];
      const last = effPath[effPath.length - 1];
      const isZeroLength =
        effPath.length === 2 &&
        Math.abs(first[0] - last[0]) < 1e-9 &&
        Math.abs(first[1] - last[1]) < 1e-9;

      if (!isZeroLength) {
        const line: TmapLineStringFeature = {
          type: "Feature",
          geometry: { type: "LineString", coordinates: effPath },
          properties: {
            index: featureIndex++,
            lineIndex: lineIndex++,
            name: getCardName(card),
            description: card.instruction,
            distance: card.distance ?? 0,
            time: card.duration ?? 0,
          },
        };
        features.push(line);
      }
    }
  }

  return { type: "FeatureCollection", features };
}

function getCardName(card: BackendNavigationCard): string {
  if (card.type === "BUS" && card.busNumber) return `${card.busNumber}번 버스`;
  if (card.type === "SUBWAY" && card.lineNumber)
    return `${card.lineNumber}호선`;
  if (card.boardingStop) return card.boardingStop;
  return "";
}
