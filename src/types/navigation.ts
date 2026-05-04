// React Navigation 화면 라우팅 타입 정의.

import type { RecommendResponse } from "./hospital";

export type RootStackParamList = {
  // 인증 전
  Login: undefined;
  Signup: undefined;

  // 피보호자
  ElderlyHome: undefined;
  MedicalChat: undefined;
  ReceivedInvitations: undefined;

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
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
