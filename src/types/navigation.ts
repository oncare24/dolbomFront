// src/types/navigation.ts

import type { RecommendResponse } from "./hospital";

export type RootStackParamList = {
  // 인증 전
  Login: undefined;
  Signup: undefined;

  // 피보호자
  ElderlyHome: undefined;
  MedicalChat: undefined;
  ReceivedInvitations: undefined;
  Sos: undefined;
  MedicationToday: undefined;
  MedicationAlarm: { scheduleId: number; medicationName: string };

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

  MedicationList: { protegeId: number };
  MedicationEdit: { protegeId: number; scheduleId?: number };

  // 보호자
  GuardianHome: undefined;
  MedicationAnalysisDetail: { protegeId: number };
  NotificationPreferences: undefined;
  /** 피보호자 상세 대시보드 (안전구역/복약 미리보기 + 진입). */
  ProtegeDetail: { protegeId: number };
  SafetyZoneList: { protegeId: number };
  SafetyZoneEdit: { protegeId: number; zoneId?: number };
  InviteWard: undefined;
  Notifications: undefined;
  SosLocationView: { eventId: number };

  /** 복약 안전 분석 흐름 (피보호자 본인 전용). 4개 화면 순차 진행. */
  MedicationAnalysisIntro: undefined;
  MedicationAnalysisForm: undefined;
  MedicationAnalysisWaiting: undefined;
  MedicationAnalysisResult: undefined;
  PrescriptionList: undefined;

  // ─── 튜토리얼 화면 (mock 데이터로 시연, 실제 API 호출 없음) ───
  TutorialHome: undefined;
  TutorialMedicalChat: undefined;
  TutorialHospitalResult: { result: RecommendResponse };
  TutorialNavigation: {
    mode: "walking" | "transit";
    startLat: number;
    startLon: number;
    endLat: number;
    endLon: number;
    endName?: string;
  };
  TutorialComplete: undefined;

  // ─── 설정 화면 ───
  ElderlySettings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type {
  TmapResponse,
  TmapFeature,
  TmapPointFeature,
  TmapLineStringFeature,
  TmapPointProperties,
  TmapLineStringProperties,
} from "./tmap";

export interface NavigationCard {
  index: number;
  point: { latitude: number; longitude: number };
  turnType: number;
  turnLabel: string;
  description: string;
  name: string;
  pathCoords: { latitude: number; longitude: number }[];
  distance: number;
  duration: number;
  pointType?: "start" | "end" | "via";
}

export interface NavigationRoute {
  cards: NavigationCard[];
  fullPath: { latitude: number; longitude: number }[];
  totalDistance: number;
  totalDuration: number;
}
