import { registerRootComponent } from "expo";
import notifee, { EventType } from "react-native-notify-kit";
import "./src/services/medicationSyncTask"; // 백그라운드 약 일정 동기화 태스크 글로벌 등록
import App from "./App";

// 백그라운드/킬 상태에서 알람 이벤트 처리.
// 풀스크린 알람은 OS가 자동으로 띄우므로 여기서는 로깅만.
// 클릭 라우팅은 App.tsx의 getInitialNotification + onForegroundEvent가 담당.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const data = detail.notification?.data as
    | { type?: string; scheduleId?: string }
    | undefined;
  if (data?.type === "MEDICATION_REMINDER" && type === EventType.PRESS) {
    console.log(
      `[MED-BG] medication alarm pressed in background scheduleId=${data.scheduleId}`,
    );
  }
});

registerRootComponent(App);
