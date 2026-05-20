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
import SafetyZoneListScreen from "./src/components/guardian/SafetyZoneListScreen";
import SafetyZoneEditScreen from "./src/components/guardian/SafetyZoneEditScreen";
import NotificationsScreen from "./src/screens/guardian/NotificationsScreen";
import SosScreen from "./src/screens/elderly/SosScreen";
import SosLocationViewScreen from "./src/screens/guardian/SosLocationViewScreen";
import MedicationTodayScreen from "./src/screens/elderly/MedicationTodayScreen";
import MedicationListScreen from "./src/screens/shared/MedicationListScreen";
import MedicationEditScreen from "./src/screens/shared/MedicationEditScreen";
import MedicationAnalysisIntroScreen from "./src/screens/elderly/MedicationAnalysisIntroScreen";
import MedicationAnalysisFormScreen from "./src/screens/elderly/MedicationAnalysisFormScreen";
import MedicationAnalysisWaitingScreen from "./src/screens/elderly/MedicationAnalysisWaitingScreen";
import MedicationAnalysisResultScreen from "./src/screens/elderly/MedicationAnalysisResultScreen";
import MedicationAnalysisDetailScreen from "./src/screens/guardian/MedicationAnalysisDetailScreen";
import NotificationPreferencesScreen from "./src/screens/guardian/NotificationPreferencesScreen";
import { useMedicationReminderSync } from "./src/hooks/useMedicationReminderSync";
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
  }, []);
  return null;
}

function AppContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const role = useAuthStore((s) => s.user?.role);
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!isAuthenticated || role !== "guardian") return;

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as
        | { type?: string; eventId?: string }
        | undefined;

      if (data?.type !== "SOS" || !data.eventId) return;

      const eventId = Number(data.eventId);
      if (Number.isNaN(eventId)) return;

      const tryNavigate = (retry = 0) => {
        if (navigationRef.isReady()) {
          navigationRef.navigate("SosLocationView", { eventId });
        } else if (retry < 10) {
          setTimeout(() => tryNavigate(retry + 1), 100);
        }
      };
      tryNavigate();
    };

    const sub =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    if (lastNotificationResponse) {
      handleResponse(lastNotificationResponse);
    }

    return () => sub.remove();
  }, [isAuthenticated, role, lastNotificationResponse]);

  useMedicationReminderSync();

  // 피보호자 시점 푸시 라우팅: 보호자가 발사한 재분석 요청 → 분석 흐름 진입.
  useEffect(() => {
    if (!isAuthenticated || role !== "elderly") return;

    const handleElderlyResponse = (
      response: Notifications.NotificationResponse,
    ) => {
      const data = response.notification.request.content.data as
        | { type?: string; wardId?: string }
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

    const sub = Notifications.addNotificationResponseReceivedListener(
      handleElderlyResponse,
    );

    if (lastNotificationResponse) {
      handleElderlyResponse(lastNotificationResponse);
    }

    return () => sub.remove();
  }, [isAuthenticated, role, lastNotificationResponse]);

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
          </>
        ) : (
          <>
            <Stack.Screen name="GuardianHome" component={GuardianHomeScreen} />
            <Stack.Screen
              name="ProtegeDetail"
              component={ProtegeDetailScreen}
            />
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
  );
}
