// 길안내 화면 래퍼.
//
// 흐름:
//   HospitalRecommendResult → 길안내 버튼 → 모달에서 모드 선택
//   → 이 화면으로 이동 (mode + 출발/도착 좌표 받음)
//   → 백엔드 /api/navigation/{walking|transit} 호출
//   → 응답을 TmapResponse로 변환
//   → NavigationScreen에 prop으로 전달
//
// NavigationScreen 자체는 친구가 만든 것 그대로 사용 (NaverMap 폴리라인 + TTS 등).

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { Colors, Spacing } from "../../theme";
import { AppHeader } from "../../components/common/Header";
import NavigationScreen from "../../components/elderly/NavigationScreen";
import {
  getWalkingRoute,
  getTransitRoute,
} from "../../services/navigationService";
import { ApiException } from "../../services/api";
import type { RootStackParamList } from "../../types/navigation";
import type { TmapResponse } from "../../types/tmap";

type Nav = NativeStackNavigationProp<RootStackParamList, "HospitalNavigation">;
type RouteParams = RouteProp<RootStackParamList, "HospitalNavigation">;

export default function HospitalNavigationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteParams>();
  const { mode, startLat, startLon, endLat, endLon, endName } = route.params;

  const [tmapResponse, setTmapResponse] = useState<TmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      console.log("[ROUTE] mode:", mode); // ★ 이거 추가
      setLoading(true);
      setError(null);
      try {
        const fn = mode === "walking" ? getWalkingRoute : getTransitRoute;
        const { tmapResponse } = await fn({
          startLat,
          startLon,
          endLat,
          endLon,
          endName,
        });
        if (!cancelled) {
          setTmapResponse(tmapResponse);
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiException && e.code === "V002") {
          console.log("[ROUTE] V002 - falling back to walking"); // ★ 추가
          // 대중교통 거리 너무 가까움
          setError(
            "거리가 너무 가까워서 대중교통 경로를 찾을 수 없어요. 도보로 안내해드릴게요.",
          );
          // 자동으로 도보로 재시도
          try {
            const { tmapResponse } = await getWalkingRoute({
              startLat,
              startLon,
              endLat,
              endLon,
              endName,
            });
            if (!cancelled) {
              setTmapResponse(tmapResponse);
              setError(null);
            }
          } catch (e2) {
            if (!cancelled) {
              setError("길안내를 불러올 수 없어요. 잠시 후 다시 시도해주세요.");
            }
          }
        } else {
          setError("길안내를 불러올 수 없어요. 잠시 후 다시 시도해주세요.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [mode, startLat, startLon, endLat, endLon, endName]);

  // 로딩
  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.surface.background}
        />
        <View style={{ paddingTop: insets.top }}>
          <AppHeader title="길안내" audience="elderly" />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>길을 찾고 있어요...</Text>
        </View>
      </View>
    );
  }

  // 에러
  if (error || !tmapResponse) {
    return (
      <View style={styles.root}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.surface.background}
        />
        <View style={{ paddingTop: insets.top }}>
          <AppHeader title="길안내" audience="elderly" />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error ?? "길안내를 불러올 수 없어요."}
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 정상 — NavigationScreen 렌더
  return (
    <NavigationScreen
      tmapResponse={tmapResponse}
      onNavigationEnd={() => navigation.goBack()}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
