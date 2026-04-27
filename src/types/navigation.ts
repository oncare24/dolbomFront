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
  SafetyZoneList: { protegeId: number }; // ★ 추가
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
