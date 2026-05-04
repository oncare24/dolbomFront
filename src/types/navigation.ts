// React Navigation 화면 라우팅 타입 + 길안내 카드/경로 타입.
//
// 두 가지 책임:
//   1. RootStackParamList - React Navigation 화면 라우트 정의
//   2. NavigationCard / NavigationRoute - parseTmapResponse 결과 타입
//      (NavigationScreen / markerFilter / tmapCardParser 등에서 공통 사용)

import type { RecommendResponse } from "./hospital";

// ──────────────────────────────────────────────
//  React Navigation 화면 라우팅 타입
// ──────────────────────────────────────────────

export type RootStackParamList = {
  // 인증 전
  Login: undefined;
  Signup: undefined;

  // 피보호자
  ElderlyHome: undefined;
  MedicalChat: undefined;
  ReceivedInvitations: undefined;
  Sos: undefined;

  /** LLM 문진 결과 (병원 카드 리스트). MedicalChat에서 done=true 시 자동 이동. */
  HospitalRecommendResult: { result: RecommendResponse };
  /** 길안내 화면. 결과 화면에서 모달로 도보/대중교통 선택 후 이동. */
  HospitalNavigation: {
    mode: "walking" | "transit";
    startLat: number;
    startLon: number;
    endLat: number;
    endLon: number;
    endName?: string;
  };

  // 보호자
  GuardianHome: undefined;
  SafetyZoneList: { protegeId: number };
  SafetyZoneEdit: { protegeId: number; zoneId?: number };
  InviteWard: undefined;
  Notifications: undefined;
  SosLocationView: { eventId: number };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// ──────────────────────────────────────────────
//  Tmap GeoJSON 타입 re-export (tmap.ts에서 정의)
// ──────────────────────────────────────────────

export type {
  TmapResponse,
  TmapFeature,
  TmapPointFeature,
  TmapLineStringFeature,
  TmapPointProperties,
  TmapLineStringProperties,
} from "./tmap";

// ──────────────────────────────────────────────
//  길안내 카드 / 경로 타입 (parseTmapResponse 결과)
// ──────────────────────────────────────────────

/**
 * 한 안내 지점 = 카드 1장.
 * Tmap GeoJSON의 Point feature + 다음 LineString feature가 합쳐진 형태.
 */
export interface NavigationCard {
  /** 0부터 시작하는 카드 순번 */
  index: number;
  /** 안내 지점 좌표 (지도 마커 위치) */
  point: { latitude: number; longitude: number };
  /**
   * TMAP turnType 코드:
   *  - 200 출발 / 201 도착
   *  - 11 직진 / 12 좌회전 / 13 우회전 / 14 유턴
   *  - 211 횡단보도
   */
  turnType: number;
  /** turnType의 한글 라벨 (예: "직진", "좌회전", "출발") */
  turnLabel: string;
  /** TTS 안내 메시지 원문 */
  description: string;
  /** 지점 명칭 또는 교차로 이름. BUS 카드는 "X번 버스", SUBWAY는 "X호선" 형태. */
  name: string;
  /** 이 카드 다음 안내지점까지의 도로 좌표 (NaverMap 폴리라인용) */
  pathCoords: { latitude: number; longitude: number }[];
  /** 이 카드 구간의 도로 거리(미터) */
  distance: number;
  /** 이 카드 구간의 예상 소요시간(초) */
  duration: number;
  /** "start", "end", "via" 등 — 첫 카드는 "start", 마지막은 "end" */
  pointType?: "start" | "end" | "via";
}

/**
 * 전체 길안내 = 카드 배열 + 통합 경로 + 합계 정보.
 * NavigationScreen에서 useState로 관리.
 */
export interface NavigationRoute {
  cards: NavigationCard[];
  /** 모든 pathCoords를 이어붙인 전체 경로 (NaverMap 메인 폴리라인용) */
  fullPath: { latitude: number; longitude: number }[];
  /** 합계 거리(미터) */
  totalDistance: number;
  /** 합계 소요시간(초) */
  totalDuration: number;
}
