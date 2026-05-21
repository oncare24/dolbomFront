// 백엔드 길안내 API 호출.
//
// 백엔드 엔드포인트:
//   POST /api/navigation/walking   - 도보 경로
//   POST /api/navigation/transit   - 대중교통 경로
//
// 응답을 NavigationScreen이 받는 TmapResponse 형식으로 변환.

import { api } from "./api";
import { backendCardsToTmapResponse } from "../utils/tmapResponseAdapter";
import type { TmapResponse } from "../types/tmap";

/**
 * 백엔드 NavigationCard (도보/대중교통 공통).
 * Spring Boot의 NavigationCard와 1:1 매칭.
 */
export interface BackendNavigationCard {
  type:
    | "WALK"
    | "BUS"
    | "SUBWAY"
    | "STRAIGHT"
    | "TURN_LEFT"
    | "TURN_RIGHT"
    | "TURN_BACK"
    | "CROSSWALK"
    | "START"
    | "ARRIVAL"
    | "OTHER";
  instruction: string;
  distance?: number;
  duration?: number;

  // 버스 전용
  busNumber?: string;
  busType?: string;

  // 지하철 전용
  lineNumber?: string;
  lineColor?: string;

  // 대중교통 공통
  boardingStop?: string;
  alightingStop?: string;
  stationsCount?: number;

  /** 실제 도로/노선 좌표. [[lon, lat], [lon, lat], ...] 형태. */
  path?: number[][];
}

export interface BackendWalkingResponse {
  totalDistance: number;
  totalTime: number;
  cards: BackendNavigationCard[];
}

export interface BackendTransitResponse {
  totalDistance: number;
  totalTime: number;
  totalWalkTime: number;
  totalFare?: number;
  transferCount: number;
  cards: BackendNavigationCard[];
}

export interface RouteRequest {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  endName?: string;
}

/**
 * 도보 길안내.
 */
export async function getWalkingRoute(
  req: RouteRequest,
): Promise<{ tmapResponse: TmapResponse; raw: BackendWalkingResponse }> {
  const res = await api.post<BackendWalkingResponse>(
    "/api/navigation/walking",
    req,
  );
  const raw = res.data as unknown as BackendWalkingResponse;

  const tmapResponse = backendCardsToTmapResponse(raw.cards, {
    startLat: req.startLat,
    startLon: req.startLon,
    endLat: req.endLat,
    endLon: req.endLon,
    totalDistance: raw.totalDistance,
    totalTime: raw.totalTime,
  });
  return { tmapResponse, raw };
}

/**
 * 대중교통 길안내.
 */
export async function getTransitRoute(
  req: RouteRequest,
): Promise<{ tmapResponse: TmapResponse; raw: BackendTransitResponse }> {
  const res = await api.post<BackendTransitResponse>(
    "/api/navigation/transit",
    req,
  );
  const raw = res.data as unknown as BackendTransitResponse;

  const tmapResponse = backendCardsToTmapResponse(raw.cards, {
    startLat: req.startLat,
    startLon: req.startLon,
    endLat: req.endLat,
    endLon: req.endLon,
    totalDistance: raw.totalDistance,
    totalTime: raw.totalTime,
  });
  return { tmapResponse, raw };
}
