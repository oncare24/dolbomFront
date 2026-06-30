// src/types/navigation.ts

export type RootStackParamList = {
  // 인증 전
  Login: undefined;
  Signup: undefined;

  // 피보호자
  ElderlyHome: undefined;
  ReceivedInvitations: undefined;
  Sos: undefined;
  MedicationToday: undefined;
  MedicationAlarm: { time: string };

  MedicationList: { protegeId: number };
  MedicationEdit: { protegeId: number; scheduleId?: number };

  // 보호자
  GuardianHome: undefined;
  MedicationAnalysisDetail: { protegeId: number };
  NotificationPreferences: undefined;
  /** 피보호자 상세 대시보드 (안전구역/복약 미리보기 + 진입). */
  ProtegeDetail: { protegeId: number };
  /** 피보호자 이상감지(활동 이상·복약 미복용) 기록 목록. */
  AnomalyLog: { protegeId: number };
  SafetyZoneList: { protegeId: number };
  SafetyZoneEdit: { protegeId: number; zoneId?: number };
  InviteWard: undefined;
  Notifications: undefined;
  SosLocationView: { eventId: number };

  // ─── 튜토리얼 화면 (mock 데이터로 시연, 실제 API 호출 없음) ───
  TutorialMedication: undefined;
  TutorialMedicationHome: undefined;
  TutorialMedicationToday: undefined;
  TutorialComplete: { topic?: "medication" } | undefined;

  // ─── 설정 화면 ───
  ElderlySettings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
