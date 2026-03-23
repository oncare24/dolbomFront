// backgroundLocation import는 index.ts에서 처리함
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";

// 기존 백그라운드 위치 테스트
import LocationTestScreen from "./src/screens/protectee/LocationTestScreen";

// 카드 길안내
import NavigationScreen from "./src/components/elderly/NavigationScreen";
import { MOCK_TMAP_RESPONSE } from "./src/mocks/mockTmapResponse";
import { parseTmapResponse, logCards } from "./src/utils/tmapCardParser";
import { fetchRouteFromCurrentLocation } from "./src/services/tmapService";

import type { TmapResponse } from "./src/types/navigation";

type Screen = "home" | "location" | "navigation";

// ── 테스트용 목적지 (금오공대 정문 부근) ──
const TEST_DESTINATION = {
  lat: 36.1456,
  lng: 128.3932,
  name: "금오공과대학교",
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [tmapResponse, setTmapResponse] = useState<TmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── Mock 데이터로 길안내 ──
  function startWithMock() {
    const route = parseTmapResponse(MOCK_TMAP_RESPONSE);
    logCards(route.cards);
    setTmapResponse(MOCK_TMAP_RESPONSE);
    setCurrentScreen("navigation");
  }

  // ── 실제 Tmap API로 길안내 ──
  async function startWithRealApi() {
    setIsLoading(true);
    try {
      const response = await fetchRouteFromCurrentLocation(
        TEST_DESTINATION.lat,
        TEST_DESTINATION.lng,
        TEST_DESTINATION.name,
      );

      const route = parseTmapResponse(response);
      logCards(route.cards);
      console.log(
        `[실제API] ${route.cards.length}장, ${route.totalDistance}m, 좌표 ${route.fullPath.length}개`,
      );

      setTmapResponse(response);
      setCurrentScreen("navigation");
    } catch (error: any) {
      console.error("[Tmap API 에러]", error);
      Alert.alert(
        "경로 요청 실패",
        `${error.message}\n\nappKey를 확인하거나 Mock 데이터로 테스트하세요.`,
        [
          { text: "Mock으로 테스트", onPress: startWithMock },
          { text: "확인", style: "cancel" },
        ],
      );
    } finally {
      setIsLoading(false);
    }
  }

  // ── 백그라운드 위치 테스트 ──
  if (currentScreen === "location") {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentScreen("home")}
        >
          <Text style={styles.backButtonText}>← 홈으로</Text>
        </TouchableOpacity>
        <LocationTestScreen />
      </View>
    );
  }

  // ── 카드 길안내 ──
  if (currentScreen === "navigation" && tmapResponse) {
    return (
      <NavigationScreen
        tmapResponse={tmapResponse}
        onNavigationEnd={() => {
          console.log("[App] 길안내 종료");
          setTmapResponse(null);
          setCurrentScreen("home");
        }}
      />
    );
  }

  // ── 홈 ──
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>보살핌 프로토타입</Text>
      <Text style={styles.subtitle}>테스트할 기능을 선택하세요</Text>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingOverlayText}>경로 요청 중...</Text>
        </View>
      )}

      {/* 1. 백그라운드 위치 */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: "#4CAF50" }]}
        onPress={() => setCurrentScreen("location")}
      >
        <Text style={styles.menuIcon}>📍</Text>
        <View style={styles.menuTextArea}>
          <Text style={styles.menuTitle}>백그라운드 위치 테스트</Text>
          <Text style={styles.menuDesc}>
            30분 간격 GPS 수집 · 파일 로그 확인
          </Text>
        </View>
      </TouchableOpacity>

      {/* 2. 실제 Tmap API 길안내 */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: "#1565C0" }]}
        onPress={startWithRealApi}
        disabled={isLoading}
      >
        <Text style={styles.menuIcon}>🗺️</Text>
        <View style={styles.menuTextArea}>
          <Text style={styles.menuTitle}>실제 경로 길안내</Text>
          <Text style={styles.menuDesc}>
            현재위치 → {TEST_DESTINATION.name} (Tmap API)
          </Text>
        </View>
      </TouchableOpacity>

      {/* 3. Mock 데이터 길안내 */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: "#37474F" }]}
        onPress={startWithMock}
      >
        <Text style={styles.menuIcon}>🧪</Text>
        <View style={styles.menuTextArea}>
          <Text style={styles.menuTitle}>Mock 데이터 길안내</Text>
          <Text style={styles.menuDesc}>
            가상 경로 · API 없이 카드 UI + TTS 테스트
          </Text>
        </View>
      </TouchableOpacity>

      {/* 4. 파싱만 테스트 */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: "#263238" }]}
        onPress={() => {
          const route = parseTmapResponse(MOCK_TMAP_RESPONSE);
          logCards(route.cards);
          alert(
            `파싱 성공!\n${route.cards.length}장 카드\n${route.totalDistance}m\n콘솔에서 상세 확인`,
          );
        }}
      >
        <Text style={styles.menuIcon}>🔍</Text>
        <View style={styles.menuTextArea}>
          <Text style={styles.menuTitle}>파싱만 테스트</Text>
          <Text style={styles.menuDesc}>
            Expo Go에서도 가능 · 콘솔에서 결과 확인
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.footer}>
        실제 경로 / Mock 길안내는 EAS Dev Build 필요{"\n"}
        파싱 테스트는 Expo Go에서도 가능{"\n"}
        tmapService.ts에 appKey 입력 필요
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#9E9E9E",
    marginBottom: 32,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  menuIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  menuTextArea: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 16,
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingOverlayText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 12,
  },
  footer: {
    marginTop: 24,
    fontSize: 13,
    color: "#616161",
    textAlign: "center",
    lineHeight: 20,
  },
});
