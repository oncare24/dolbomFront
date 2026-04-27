// React Navigation 화면 라우팅 타입 정의.

export type RootStackParamList = {
  // 인증 전
  Login: undefined;
  Signup: undefined;

  // 피보호자
  ElderlyHome: undefined;
  MedicalChat: undefined; // ★ 병원 찾기 LLM 문진 채팅

  // 보호자
  GuardianHome: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
