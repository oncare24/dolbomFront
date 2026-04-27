// 보살핌 - 메인 진입점
// 인증 상태 기반 라우팅 분기

import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAuthStore } from "./src/stores/authStore";
import { Colors } from "./src/theme/colors";
import { ToastProvider } from "./src/components/common/Toast";

import type { RootStackParamList } from "./src/types/navigation";

import LoginScreen from "./src/screens/auth/LoginScreen";
import SignupScreen from "./src/screens/auth/SignupScreen";
import ElderlyHomeScreen from "./src/components/elderly/ElderlyHomeScreen";
import MedicalChatScreen from "./src/screens/elderly/MedicalChatScreen"; // ★
import GuardianHomePlaceholder from "./src/screens/guardian/GuardianHomePlaceholder";

const Stack = createNativeStackNavigator<RootStackParamList>();

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
            <Stack.Screen
              name="MedicalChat"
              component={MedicalChatScreen}
            />{" "}
            {/* ★ */}
          </>
        ) : (
          <Stack.Screen
            name="GuardianHome"
            component={GuardianHomePlaceholder}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </SafeAreaProvider>
  );
}
