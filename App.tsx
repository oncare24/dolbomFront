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
import MedicalChatScreen from "./src/screens/elderly/MedicalChatScreen";
import HospitalRecommendResultScreen from "./src/screens/elderly/HospitalRecommendResultScreen";
import HospitalNavigationScreen from "./src/screens/elderly/HospitalNavigationScreen";
import GuardianHomeScreen from "./src/components/guardian/GuardianHomeScreen";
import ProtegeDetailScreen from "./src/screens/guardian/ProtegeDetailScreen";
import AnomalyLogScreen from "./src/screens/guardian/AnomalyLogScreen";
import SafetyZoneListScreen from "./src/components/guardian/SafetyZoneListScreen";
import SafetyZoneEditScreen from "./src/components/guardian/SafetyZoneEditScreen";
import NotificationsScreen from "./src/screens/guardian/NotificationsScreen";
import SosScreen from "./src/screens/elderly/SosScreen";
import SosLocationViewScreen from "./src/screens/guardian/SosLocationViewScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { registerMedicationSyncTask } from "./src/services/medicationSyncTask";
// ─── 튜토리얼 화면 ───
import TutorialHomeScreen from "./src/screens/tutorial/TutorialHomeScreen";
import TutorialMedicalChatScreen from "./src/screens/tutorial/TutorialMedicalChatScreen";
import TutorialHospitalResultScreen from "./src/screens/tutorial/TutorialHospitalResultScreen";
import TutorialNavigationScreen from "./src/screens/tutorial/TutorialNavigationScreen";
import TutorialCompleteScreen from "./src/screens/tutorial/TutorialCompleteScreen";

// ─── 설정 화면 ───
import ElderlySettingsScreen from "./src/screens/elderly/ElderlySettingsScreen";

import MedicationTodayScreen from "./src/screens/elderly/MedicationTodayScreen";
import MedicationListScreen from "./src/screens/shared/MedicationListScreen";
import MedicationEditScreen from "./src/screens/shared/MedicationEditScreen";
import MedicationAnalysisIntroScreen from "./src/screens/elderly/MedicationAnalysisIntroScreen";
import MedicationAnalysisFormScreen from "./src/screens/elderly/MedicationAnalysisFormScreen";
import MedicationAnalysisWaitingScreen from "./src/screens/elderly/MedicationAnalysisWaitingScreen";
import MedicationAnalysisResultScreen from "./src/screens/elderly/MedicationAnalysisResultScreen";
import MedicationAnalysisDetailScreen from "./src/screens/guardian/MedicationAnalysisDetailScreen";
import NotificationPreferencesScreen from "./src/screens/guardian/NotificationPreferencesScreen";
import PrescriptionListScreen from "./src/screens/elderly/PrescriptionListScreen";
import { useMedicationReminderSync } from "./src/hooks/useMedicationReminderSync";
import notifee, { EventType } from "react-native-notify-kit";
import MedicationAlarmScreen from "./src/screens/elderly/MedicationAlarmScreen";
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
    if (!isAuthenticated || role !== "elderly") return;

    // notifee 이벤트 (medication 알람 — 풀스크린 진입)
    const unsubNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      const data = detail.notification?.data as
        | { type?: string; scheduleId?: string; medicationName?: string }
        | undefined;

      if (data?.type !== "MEDICATION_REMINDER") return;
      if (type !== EventType.DELIVERED && type !== EventType.PRESS) return;
      if (!data.scheduleId || !data.medicationName) return;

      const scheduleId = Number(data.scheduleId);
      if (Number.isNaN(scheduleId)) return;

      const tryNavigate = (retry = 0) => {
        if (navigationRef.isReady()) {
          navigationRef.navigate("MedicationAlarm", {
            scheduleId,
            medicationName: data.medicationName!,
          });
        } else if (retry < 10) {
          setTimeout(() => tryNavigate(retry + 1), 100);
        }
      };
      tryNavigate();
    });

    // expo-notifications 이벤트 (DRUG_ANALYSIS_REFRESH_REQUEST 등 기존 알림)
    const handleExpoResponse = (
      response: Notifications.NotificationResponse,
    ) => {
      const data = response.notification.request.content.data as
        | { type?: string }
        | undefined;

      if (data?.type !== "DRUG_ANALYSIS_REFRESH_REQUEST") return;

      const tryNavigate = (retry = 0) => {
        if (navigationRef.isReady()) {
          navigationRef.navigate("MedicationAnalysisIntro");
        } else if (retry < 10) {
          setTimeout(() => tryNavigate(retry + 1), 100);
        }
      };
      tryNavigate();
    };

    const subExpo =
      Notifications.addNotificationResponseReceivedListener(handleExpoResponse);

    if (lastNotificationResponse) {
      handleExpoResponse(lastNotificationResponse);
    }

    // 앱이 알람으로 시작된 경우 (cold start)
    notifee.getInitialNotification().then((initial) => {
      if (!initial) return;
      const data = initial.notification.data as
        | { type?: string; scheduleId?: string; medicationName?: string }
        | undefined;
      if (data?.type !== "MEDICATION_REMINDER") return;
      if (!data.scheduleId || !data.medicationName) return;
      const scheduleId = Number(data.scheduleId);
      if (Number.isNaN(scheduleId)) return;

      const tryNavigate = (retry = 0) => {
        if (navigationRef.isReady()) {
          navigationRef.navigate("MedicationAlarm", {
            scheduleId,
            medicationName: data.medicationName!,
          });
        } else if (retry < 10) {
          setTimeout(() => tryNavigate(retry + 1), 100);
        }
      };
      tryNavigate();
    });

    return () => {
      unsubNotifee();
      subExpo.remove();
    };
  }, [isAuthenticated, role, lastNotificationResponse]);

  // 백그라운드/잠금에서 알람이 울려 앱이 떠오른 경우(FSI), 표시 중인 약 알람을
  // 찾아 약 알람 화면으로 진입. onForegroundEvent가 못 잡는 백그라운드 진입 보완.
  useEffect(() => {
    if (!isAuthenticated || role !== "elderly") return;

    const openAlarmIfDisplayed = async () => {
      try {
        const displayed = await notifee.getDisplayedNotifications();
        const alarm = displayed.find(
          (d) =>
            (d.notification.data as { type?: string } | undefined)?.type ===
            "MEDICATION_REMINDER",
        );
        const data = alarm?.notification.data as
          | { scheduleId?: string; medicationName?: string }
          | undefined;
        if (!data?.scheduleId || !data.medicationName) return;
        const scheduleId = Number(data.scheduleId);
        if (Number.isNaN(scheduleId)) return;

        const tryNavigate = (retry = 0) => {
          if (navigationRef.isReady()) {
            navigationRef.navigate("MedicationAlarm", {
              scheduleId,
              medicationName: data.medicationName!,
            });
          } else if (retry < 10) {
            setTimeout(() => tryNavigate(retry + 1), 100);
          }
        };
        tryNavigate();
      } catch (e) {
        console.warn("[MED-ALARM] openAlarmIfDisplayed failed:", e);
      }
    };

    openAlarmIfDisplayed();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") openAlarmIfDisplayed();
    });
    return () => sub.remove();
  }, [isAuthenticated, role]);

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
        case "DRUG_ANALYSIS_REFRESH_REQUEST":
          tryNavigate(() => navigationRef.navigate("MedicationAnalysisIntro"));
          break;
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
            <Stack.Screen name="MedicalChat" component={MedicalChatScreen} />
            <Stack.Screen
              name="HospitalRecommendResult"
              component={HospitalRecommendResultScreen}
            />
            <Stack.Screen
              name="HospitalNavigation"
              component={HospitalNavigationScreen}
            />
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
            <Stack.Screen name="TutorialHome" component={TutorialHomeScreen} />
            <Stack.Screen
              name="TutorialMedicalChat"
              component={TutorialMedicalChatScreen}
            />
            <Stack.Screen
              name="TutorialHospitalResult"
              component={TutorialHospitalResultScreen}
            />
            <Stack.Screen
              name="TutorialNavigation"
              component={TutorialNavigationScreen}
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
              name="MedicationAnalysisIntro"
              component={MedicationAnalysisIntroScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MedicationAnalysisForm"
              component={MedicationAnalysisFormScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MedicationAnalysisWaiting"
              component={MedicationAnalysisWaitingScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="MedicationAnalysisResult"
              component={MedicationAnalysisResultScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PrescriptionList"
              component={PrescriptionListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MedicationAlarm"
              component={MedicationAlarmScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="GuardianHome" component={GuardianHomeScreen} />
            <Stack.Screen
              name="ProtegeDetail"
              component={ProtegeDetailScreen}
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
