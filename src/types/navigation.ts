// React Navigation 화면 라우팅 타입 정의.

export type RootStackParamList = {
  // 인증 전
  Login: undefined;
  Signup: undefined;

  // 피보호자
  ElderlyHome: undefined;
  MedicalChat: undefined;

  // 보호자
  GuardianHome: undefined;
  SafetyZoneList: { protegeId: number };
  SafetyZoneEdit: { protegeId: number; zoneId?: number }; // ★ 추가 (zoneId 없으면 신규 등록)
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
