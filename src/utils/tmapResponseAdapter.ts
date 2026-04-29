// 백엔드 NavigationCard[] → 친구 NavigationScreen이 기대하는 TmapResponse(GeoJSON).
//
// 친구가 만든 NavigationScreen은 Tmap 원본 GeoJSON FeatureCollection을 prop으로 받아
// parseTmapResponse(tmapResponse) 로 카드 배열을 만든다.
//
// 변환 전략:
//   1. 백엔드 카드의 path 필드가 있으면 그걸 LineString feature로 사용 (실제 도로 좌표)
//   2. path가 없으면 출발↔도착 직선 보간 (폴백)
//
// path를 사용하면 NaverMap 폴리라인이 실제 도로/노선을 따라 그려져 정확함.

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

/**
 * 백엔드 카드 리스트를 GeoJSON 형식으로 변환.
 *
 * - path 있는 카드: 그 path의 첫 좌표를 Point로, path 전체를 LineString으로
 * - path 없는 카드: 출발↔도착 사이 균등 분할 (폴백)
 */
export function backendCardsToTmapResponse(
  cards: BackendNavigationCard[],
  ctx: AdapterContext,
): TmapResponse {
  const features: TmapFeature[] = [];

  if (cards.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }

  // 폴백용 좌표 (path 없는 카드를 위해)
  const cardCount = cards.length;
  const fallbackCoords: [number, number][] = [];
  for (let i = 0; i < cardCount; i++) {
    const t = cardCount === 1 ? 0 : i / (cardCount - 1);
    const lon = ctx.startLon + (ctx.endLon - ctx.startLon) * t;
    const lat = ctx.startLat + (ctx.endLat - ctx.startLat) * t;
    fallbackCoords.push([lon, lat]);
  }

  let pointIndex = 0;
  let lineIndex = 0;
  let featureIndex = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const isFirst = i === 0;
    const isLast = i === cards.length - 1;

    // 카드 시작 좌표 결정
    // - path 있으면 path 첫 좌표
    // - 없으면 폴백 좌표
    // - 첫 카드(START)는 출발 좌표 사용
    // - 마지막 카드(ARRIVAL)는 도착 좌표 사용
    let pointCoord: [number, number];
    if (isFirst) {
      pointCoord = [ctx.startLon, ctx.startLat];
    } else if (isLast) {
      pointCoord = [ctx.endLon, ctx.endLat];
    } else if (card.path && card.path.length > 0) {
      const first = card.path[0];
      pointCoord = [first[0], first[1]];
    } else {
      pointCoord = fallbackCoords[i];
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
    if (!isLast) {
      const lineCoords: [number, number][] = card.path && card.path.length > 1
        ? card.path.map((p) => [p[0], p[1]] as [number, number])
        : [pointCoord, fallbackCoords[i + 1]];

      const line: TmapLineStringFeature = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: lineCoords },
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

  return { type: "FeatureCollection", features };
}

function getCardName(card: BackendNavigationCard): string {
  if (card.type === "BUS" && card.busNumber) return `${card.busNumber}번 버스`;
  if (card.type === "SUBWAY" && card.lineNumber) return `${card.lineNumber}호선`;
  if (card.boardingStop) return card.boardingStop;
  return "";
}
