import { registerRootComponent } from "expo";
import notifee, { EventType } from "react-native-notify-kit";
import "./src/services/medicationSyncTask"; // 백그라운드 약 일정 동기화 태스크 글로벌 등록
import { setPendingAlarm } from "./src/services/medicationReminderService";
import { launchAlarmActivity } from "./modules/alarm-kit";
import App from "./App";

// 백그라운드/킬 상태에서 알람 이벤트 처리.
// 풀스크린 알람은 OS가 자동으로 띄우지만, 화면 꺼짐/백그라운드에서 울린(delivered)
// 또는 눌린(press) 이벤트는 App.tsx의 onForegroundEvent/getInitialNotification이
// 못 잡는다(FSI 자동실행은 press가 아니라 getInitialNotification이 null을 줌).
// → 여기서 시각을 저장해두고, 앱이 떠오른 뒤 인증 복원까지 끝낸 다음 App.tsx가
//   그 값을 읽어 풀스크린 알람 화면으로 라우팅한다.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const data = detail.notification?.data as
    | { type?: string; time?: string; scheduleId?: string }
    | undefined;
  if (data?.type !== "MEDICATION_REMINDER") return;
  if (type === EventType.DELIVERED || type === EventType.PRESS) {
    if (data.time) await setPendingAlarm(data.time);
    // 다른 앱 사용 중/홈 화면이어도 풀스크린 알람을 강제로 띄운다.
    // ("다른 앱 위에 표시" 권한이 있으면 백그라운드 액티비티 시작이 허용됨.
    //  권한 없으면 OS가 막아 헤드업 알림으로 자연 폴백 — launchAlarmActivity는 안전하게 무시됨)
    launchAlarmActivity();
    console.log(`[MED-BG] pending stored + activity launch time=${data.time}`);
  }
});

registerRootComponent(App);
