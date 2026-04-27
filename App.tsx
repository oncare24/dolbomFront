// 보살핌 - 메인 진입점
// 인증 상태 기반 라우팅 분기

import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useAuthStore } from "./src/stores/authStore";
import { Colors } from "./src/theme/colors";
import { ToastProvider, useToast } from "./src/components/common/Toast";
import { registerToast } from "./src/utils/toastBridge";

import type { RootStackParamList } from "./src/types/navigation";

import LoginScreen from "./src/screens/auth/LoginScreen";
import SignupScreen from "./src/screens/auth/SignupScreen";
import ElderlyHomeScreen from "./src/components/elderly/ElderlyHomeScreen";
import MedicalChatScreen from "./src/screens/elderly/MedicalChatScreen";
import GuardianHomeScreen from "./src/components/guardian/GuardianHomeScreen";
import SafetyZoneListScreen from "./src/components/guardian/SafetyZoneListScreen";
import SafetyZoneEditScreen from "./src/components/guardian/SafetyZoneEditScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

// React Query 전역 클라이언트.
// - staleTime 5분: 그 동안 같은 쿼리 재호출 시 네트워크 안 타고 캐시에서 즉시 반환
// - retry 1: 네트워크 일시 오류에 한 번만 재시도 (axios 인터셉터가 이미 401 재발급 처리하므로 적게)
// - refetchOnWindowFocus: 웹 전용 옵션이라 RN에서는 무의미 → false
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

// ToastProvider 안쪽에서 useToast() 훅을 호출해 외부 브리지에 등록.
function ToastBridgeRegister() {
  const toast = useToast();
  useEffect(() => {
    registerToast(toast.show);
  }, [toast.show]);
  return null;
}

function AppContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const role = useAuthStore((s) => s.user?.role);

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
    <NavigationContainer>
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
          </>
        ) : (
          <>
            <Stack.Screen name="GuardianHome" component={GuardianHomeScreen} />
            <Stack.Screen
              name="SafetyZoneList"
              component={SafetyZoneListScreen}
            />
            <Stack.Screen
              name="SafetyZoneEdit"
              component={SafetyZoneEditScreen}
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
            <AppContent />
          </ToastProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
