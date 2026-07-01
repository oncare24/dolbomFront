// App.tsx

// 보살핌 - 메인 진입점
// 인증 상태 기반 라우팅 분기

import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InvitationListScreen from "./src/screens/elderly/InvitationListScreen";
import { useAuthStore } from "./src/stores/authStore";
import { Colors } from "./src/theme/colors";
import { ToastProvider, useToast } from "./src/components/common/Toast";
import { registerToast } from "./src/utils/toastBridge";
import InviteWardScreen from "./src/screens/guardian/InviteWardScreen";
import type { RootStackParamList } from "./src/types/navigation";
import "./src/services/backgroundLocationTask";
import {
  configureNotificationHandler,
  registerAndroidNotificationChannel,
} from "./src/services/notificationService";
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignupScreen from "./src/screens/auth/SignupScreen";
import ElderlyHomeScreen from "./src/components/elderly/ElderlyHomeScreen";
import GuardianHomeScreen from "./src/components/guardian/GuardianHomeScreen";
import ProtegeDetailScreen from "./src/screens/guardian/ProtegeDetailScreen";
import GuardianMedicationOverviewScreen from "./src/screens/guardian/GuardianMedicationOverviewScreen";
import AnomalyLogScreen from "./src/screens/guardian/AnomalyLogScreen";
import SafetyZoneListScreen from "./src/components/guardian/SafetyZoneListScreen";
import SafetyZoneEditScreen from "./src/components/guardian/SafetyZoneEditScreen";
import NotificationsScreen from "./src/screens/guardian/NotificationsScreen";
import SosScreen from "./src/screens/elderly/SosScreen";
import SosLocationViewScreen from "./src/screens/guardian/SosLocationViewScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { registerMedicationSyncTask } from "./src/services/medicationSyncTask";
// ─── 튜토리얼 화면 ───
import TutorialCompleteScreen from "./src/screens/tutorial/TutorialCompleteScreen";
import TutorialMedicationScreen from "./src/screens/tutorial/TutorialMedicationScreen";
import TutorialMedicationHomeScreen from "./src/screens/tutorial/TutorialMedicationHomeScreen";
import TutorialMedicationTodayScreen from "./src/screens/tutorial/TutorialMedicationTodayScreen";

// ─── 설정 화면 ───
import ElderlySettingsScreen from "./src/screens/elderly/ElderlySettingsScreen";

import MedicationTodayScreen from "./src/screens/elderly/MedicationTodayScreen";
import MedicationListScreen from "./src/screens/shared/MedicationListScreen";
import MedicationEditScreen from "./src/screens/shared/MedicationEditScreen";
import MedicationAnalysisDetailScreen from "./src/screens/guardian/MedicationAnalysisDetailScreen";
import NotificationPreferencesScreen from "./src/screens/guardian/NotificationPreferencesScreen";
import { useMedicationReminderSync } from "./src/hooks/useMedicationReminderSync";
import { consumePendingAlarm } from "./src/services/medicationReminderService";
import { hasMissingCriticalPermissions } from "./src/services/permissionService";
import notifee, { EventType } from "react-native-notify-kit";
import MedicationAlarmScreen from "./src/screens/elderly/MedicationAlarmScreen";
import PermissionSetupScreen from "./src/screens/elderly/PermissionSetupScreen";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { medicationKeys } from "./src/hooks/useMedications";
import { invitationKeys } from "./src/hooks/useInvitations";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

configureNotificationHandler();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function ToastBridgeRegister() {
  const toast = useToast();
  useEffect(() => {
    registerToast(toast.show);
  }, [toast.show]);
  return null;
}

function NotificationChannelInitializer() {
  useEffect(() => {
    registerAndroidNotificationChannel().catch((e) =>
      console.warn("[FCM] channel registration failed:", e),
    );
    registerMedicationSyncTask(); // ← 추가
  }, []);
  return null;
}

function AppContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const role = useAuthStore((s) => s.user?.role);
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const qc = useQueryClient();

  // 피보호자 시점 알림 클릭 라우팅
  useEffect(() => {
    if (!isHydrated || !isAuthenticated || role !== "elderly") return;

    // notifee 이벤트 (medication 알람 — 풀스크린 진입)
    const unsubNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      const data = detail.notification?.data as
        | { type?: string; time?: string }
        | undefined;

      if (data?.type !== "MEDICATION_REMINDER") return;
      if (type !== EventType.DELIVERED && type !== EventType.PRESS) return;
      if (!data.time) return;

      const time = data.time;

      const tryNavigate = (retry = 0) => {
        if (navigationRef.isReady()) {
          navigationRef.navigate("MedicationAlarm", { time });
        } else if (retry < 10) {
          setTimeout(() => tryNavigate(retry + 1), 100);
        }
      };
      tryNavigate();
    });

    // 앱이 알람으로 시작된 경우 (cold start)
    notifee.getInitialNotification().then((initial) => {
      if (!initial) return;
      const data = initial.notification.data as
        | { type?: string; time?: string }
        | undefined;
      if (data?.type !== "MEDICATION_REMINDER") return;
      if (!data.time) return;
      const time = data.time;

      const tryNavigate = (retry = 0) => {
        if (navigationRef.isReady()) {
          navigationRef.navigate("MedicationAlarm", { time });
        } else if (retry < 10) {
          setTimeout(() => tryNavigate(retry + 1), 100);
        }
      };
      tryNavigate();
    });

    return () => {
      unsubNotifee();
    };
  }, [isHydrated, isAuthenticated, role, lastNotificationResponse]);

  // 백그라운드/잠금에서 알람이 울려 앱이 떠오른 경우(FSI) 풀스크린 알람 화면으로 진입.
  // onForegroundEvent/getInitialNotification이 못 잡는 콜드/백그라운드 진입 보완.
  // isHydrated 게이트로 인증 복원 전 진입(흰 화면·기록 누락)을 막는다.
  useEffect(() => {
    if (!isHydrated || !isAuthenticated || role !== "elderly") return;

    let cancelled = false;

    const navigateToAlarm = (time: string, retry = 0) => {
      if (cancelled) return;
      if (navigationRef.isReady()) {
        navigationRef.navigate("MedicationAlarm", { time });
      } else if (retry < 15) {
        setTimeout(() => navigateToAlarm(time, retry + 1), 100);
      }
    };

    // 1순위: 백그라운드 이벤트가 저장해둔 pending 알람 시각(라우팅 진실원천).
    // 2순위: 트레이에 표시 중인 알람(pending이 아직 없을 때).
    // 둘 다 없으면 콜드 스타트 직후 등록 지연 대비로 잠깐 재시도.
    const routeToAlarm = async (attempt = 0) => {
      if (cancelled) return;
      try {
        const pending = await consumePendingAlarm();
        if (pending) {
          navigateToAlarm(pending);
          return;
        }
        const displayed = await notifee.getDisplayedNotifications();
        const alarm = displayed.find(
          (d) =>
            (d.notification.data as { type?: string } | undefined)?.type ===
            "MEDICATION_REMINDER",
        );
        const time = (
          alarm?.notification.data as { time?: string } | undefined
        )?.time;
        if (time) {
          navigateToAlarm(time);
          return;
        }
        if (attempt < 5) {
          setTimeout(() => routeToAlarm(attempt + 1), 200);
        }
      } catch (e) {
        console.warn("[MED-ALARM] routeToAlarm failed:", e);
      }
    };

    routeToAlarm();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") routeToAlarm();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [isHydrated, isAuthenticated, role]);

  // 어르신 로그인 후: 풀스크린 알람에 필수인 권한이 빠졌으면 1회 권한 온보딩으로 안내.
  //  - 단발 타이머 대신 "네비 준비 + 홈 화면일 때"까지 재시도해 놓치지 않게 한다.
  //  - 알람으로 시작된 콜드스타트(MedicationAlarm)와는 충돌하지 않도록 홈일 때만 이동.
  //  - permPromptedRef로 세션당 1회만(닫고 "나중에 하기" 해도 재진입 안 함).
  const permPromptedRef = React.useRef(false);
  useEffect(() => {
    if (!isHydrated || !isAuthenticated || role !== "elderly") return;
    if (permPromptedRef.current) return;

    let cancelled = false;

    const tryPrompt = async (attempt = 0) => {
      if (cancelled || permPromptedRef.current) return;

      // 네비게이션이 아직 준비 안 됐으면 잠깐 뒤 재시도.
      if (!navigationRef.isReady()) {
        if (attempt < 20) setTimeout(() => tryPrompt(attempt + 1), 150);
        return;
      }
      // 알람 등 다른 흐름이 떠 있으면 끼어들지 않고 홈으로 돌아올 때까지 대기.
      const current = navigationRef.getCurrentRoute()?.name;
      if (current && current !== "ElderlyHome") {
        if (attempt < 20) setTimeout(() => tryPrompt(attempt + 1), 300);
        return;
      }

      try {
        if (!(await hasMissingCriticalPermissions())) return; // 다 허용 → 안 띄움
        if (cancelled || permPromptedRef.current) return;
        permPromptedRef.current = true;
        navigationRef.navigate("PermissionSetup");
      } catch (e) {
        console.warn("[PERM] onboarding check failed:", e);
      }
    };

    // 알람 콜드스타트 라우팅이 먼저 자리잡도록 살짝 양보 후 시작.
    const t = setTimeout(() => tryPrompt(), 800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [isHydrated, isAuthenticated, role]);

  useMedicationReminderSync();

  // 피보호자 시점 푸시 라우팅: 보호자 재분석 요청 → 분석 흐름, 보호자 초대 → 받은 초대 화면.
  useEffect(() => {
    if (!isAuthenticated || role !== "elderly") return;

    const handleElderlyResponse = (
      response: Notifications.NotificationResponse,
    ) => {
      const data = response.notification.request.content.data as
        | { type?: string; wardId?: string }
        | undefined;
      if (!data?.type) return;

      const tryNavigate = (action: () => void, retry = 0) => {
        if (navigationRef.isReady()) {
          action();
        } else if (retry < 10) {
          setTimeout(() => tryNavigate(action, retry + 1), 100);
        }
      };

      switch (data.type) {
        case "WARD_INVITATION":
          // 받은 초대 목록을 강제로 새로 불러온 뒤 진입 → 새 초대가 바로 보임.
          qc.invalidateQueries({ queryKey: invitationKeys.received() });
          tryNavigate(() => navigationRef.navigate("ReceivedInvitations"));
          break;
      }
    };

    const sub = Notifications.addNotificationResponseReceivedListener(
      handleElderlyResponse,
    );

    if (lastNotificationResponse) {
      handleElderlyResponse(lastNotificationResponse);
    }

    return () => sub.remove();
  }, [isAuthenticated, role, lastNotificationResponse, qc]);

  // 보호자 시점 알림 클릭 라우팅 — 푸시 자체를 탭했을 때 (SOS 등).
  useEffect(() => {
    if (!isAuthenticated || role !== "guardian") return;

    const handleGuardianResponse = (
      response: Notifications.NotificationResponse,
    ) => {
      const data = response.notification.request.content.data as
        | {
            type?: string;
            eventId?: string;
            wardId?: string;
            scheduleId?: string;
          }
        | undefined;
      if (!data?.type) return;

      const tryNavigate = (action: () => void, retry = 0) => {
        if (navigationRef.isReady()) {
          action();
        } else if (retry < 10) {
          setTimeout(() => tryNavigate(action, retry + 1), 100);
        }
      };

      switch (data.type) {
        case "SOS": {
          if (!data.eventId) return;
          const eventId = Number(data.eventId);
          if (Number.isNaN(eventId)) return;
          tryNavigate(() =>
            navigationRef.navigate("SosLocationView", { eventId }),
          );
          break;
        }
        case "ZONE_EXIT":
        case "ZONE_ENTER": {
          if (!data.wardId) return;
          const protegeId = Number(data.wardId);
          if (Number.isNaN(protegeId)) return;
          tryNavigate(() =>
            navigationRef.navigate("SafetyZoneList", { protegeId }),
          );
          break;
        }
        case "WARD_INVITATION":
          tryNavigate(() => navigationRef.navigate("Notifications"));
          break;
        default:
          tryNavigate(() => navigationRef.navigate("Notifications"));
      }
    };

    const sub = Notifications.addNotificationResponseReceivedListener(
      handleGuardianResponse,
    );

    if (lastNotificationResponse) {
      handleGuardianResponse(lastNotificationResponse);
    }

    return () => sub.remove();
  }, [isAuthenticated, role, lastNotificationResponse]);

  // 어머니 시점: 보호자가 schedule 변경한 silent push 수신 → schedule invalidate.
  // useMedicationReminderSync가 자동으로 OS 알람 재동기화.
  useEffect(() => {
    if (!isAuthenticated || role !== "elderly") return;

    const sub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as
          | { type?: string }
          | undefined;
        if (data?.type === "MEDICATION_SCHEDULE_CHANGED") {
          qc.invalidateQueries({ queryKey: medicationKeys.scheduleLists() });
          console.log("[MED-SYNC] received schedule-changed push, invalidated");
        }
      },
    );

    return () => sub.remove();
  }, [isAuthenticated, role, qc]);

  // 어머니 시점: 앱 포그라운드 진입 시 schedule 강제 invalidate.
  // silent push가 종료 상태에서 못 받았을 때의 fallback.
  useEffect(() => {
    if (!isAuthenticated || role !== "elderly") return;

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        qc.invalidateQueries({ queryKey: medicationKeys.scheduleLists() });
      }
    });

    return () => sub.remove();
  }, [isAuthenticated, role, qc]);

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.surface.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : role === "elderly" ? (
          <>
            <Stack.Screen name="ElderlyHome" component={ElderlyHomeScreen} />
            <Stack.Screen
              name="ReceivedInvitations"
              component={InvitationListScreen}
            />
            <Stack.Screen name="Sos" component={SosScreen} />

            {/* ─── 설정 화면 ─── */}
            <Stack.Screen
              name="ElderlySettings"
              component={ElderlySettingsScreen}
            />

            {/* ─── 튜토리얼 화면 ─── */}
            <Stack.Screen
              name="TutorialMedicationHome"
              component={TutorialMedicationHomeScreen}
            />
            <Stack.Screen
              name="TutorialMedicationToday"
              component={TutorialMedicationTodayScreen}
            />
            <Stack.Screen
              name="TutorialMedication"
              component={TutorialMedicationScreen}
            />
            <Stack.Screen
              name="TutorialComplete"
              component={TutorialCompleteScreen}
            />
            <Stack.Screen
              name="MedicationToday"
              component={MedicationTodayScreen}
            />
            <Stack.Screen
              name="MedicationList"
              component={MedicationListScreen}
            />
            <Stack.Screen
              name="MedicationEdit"
              component={MedicationEditScreen}
            />
            <Stack.Screen
              name="MedicationAlarm"
              component={MedicationAlarmScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="PermissionSetup"
              component={PermissionSetupScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="GuardianHome" component={GuardianHomeScreen} />
            <Stack.Screen
              name="ProtegeDetail"
              component={ProtegeDetailScreen}
            />
            <Stack.Screen
              name="GuardianMedicationOverview"
              component={GuardianMedicationOverviewScreen}
            />
            <Stack.Screen name="AnomalyLog" component={AnomalyLogScreen} />
            <Stack.Screen
              name="SafetyZoneList"
              component={SafetyZoneListScreen}
            />
            <Stack.Screen
              name="SafetyZoneEdit"
              component={SafetyZoneEditScreen}
            />
            <Stack.Screen
              name="MedicationList"
              component={MedicationListScreen}
            />
            <Stack.Screen
              name="MedicationEdit"
              component={MedicationEditScreen}
            />
            <Stack.Screen name="InviteWard" component={InviteWardScreen} />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />
            <Stack.Screen
              name="SosLocationView"
              component={SosLocationViewScreen}
            />
            <Stack.Screen
              name="MedicationAnalysisDetail"
              component={MedicationAnalysisDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="NotificationPreferences"
              component={NotificationPreferencesScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
            <ToastProvider>
              <ToastBridgeRegister />
              <NotificationChannelInitializer />
              <AppContent />
            </ToastProvider>
          </KeyboardProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
