// 길안내 화면 래퍼 (mode 분기).
//
// 흐름:
//   HospitalRecommendResult → 길안내 버튼 → 모달에서 모드 선택
//   → 이 화면으로 이동 (mode + 출발/도착 좌표 받음)
//
// 모드별 분기:
//   - walking: NavigationScreen (지도 + GPS 추적)
//   - transit: TransitGuideScreen (정류장/버스 카드 리스트)

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
import TransitGuideScreen from "../../components/elderly/TransitGuideScreen";
import {
  getWalkingRoute,
  getTransitRoute,
  type BackendTransitResponse,
} from "../../services/navigationService";
import { ApiException } from "../../services/api";
import type { RootStackParamList } from "../../types/navigation";
import type { TmapResponse } from "../../types/tmap";
import * as Location from "expo-location";
type Nav = NativeStackNavigationProp<RootStackParamList, "HospitalNavigation">;
type RouteParams = RouteProp<RootStackParamList, "HospitalNavigation">;

export default function HospitalNavigationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteParams>();
  const { mode, startLat, startLon, endLat, endLon, endName } = route.params;

  // 도보용
  const [tmapResponse, setTmapResponse] = useState<TmapResponse | null>(null);
  // 대중교통용 (raw 백엔드 응답)
  const [transitData, setTransitData] = useState<BackendTransitResponse | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      console.log("[ROUTE] mode:", mode);
      setLoading(true);
      setError(null);
      setTmapResponse(null);
      setTransitData(null);

      // 길안내 시작 시점의 현재 GPS를 출발지로 사용
      // (문진 시점 좌표 result.userLatitude/Longitude는 이미 이동했을 수 있음)
      let actualStartLat = startLat;
      let actualStartLon = startLon;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          actualStartLat = pos.coords.latitude;
          actualStartLon = pos.coords.longitude;
        }
      } catch {
        // 못 받으면 fallback으로 문진 시점 좌표 사용
      }

      try {
        if (mode === "walking") {
          const { tmapResponse } = await getWalkingRoute({
            startLat: actualStartLat,
            startLon: actualStartLon,
            endLat,
            endLon,
            endName,
          });
          if (!cancelled) setTmapResponse(tmapResponse);
        } else {
          const { raw } = await getTransitRoute({
            startLat: actualStartLat,
            startLon: actualStartLon,
            endLat,
            endLon,
            endName,
          });
          if (!cancelled) setTransitData(raw);
        }
      } catch (e) {
        if (cancelled) return;

        if (e instanceof ApiException && e.code === "V002") {
          console.log("[ROUTE] V002 - falling back to walking");
          setError(
            "거리가 너무 가까워서 대중교통 경로를 찾을 수 없어요. 도보로 안내해드릴게요.",
          );
          try {
            const { tmapResponse } = await getWalkingRoute({
              startLat: actualStartLat,
              startLon: actualStartLon,
              endLat,
              endLon,
              endName,
            });
            if (!cancelled) {
              setTmapResponse(tmapResponse);
              setError(null);
            }
          } catch {
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
          <Text style={styles.loadingText}>
            {mode === "transit"
              ? "대중교통 경로를 찾고 있어요..."
              : "길을 찾고 있어요..."}
          </Text>
        </View>
      </View>
    );
  }

  // 에러
  if (error || (!tmapResponse && !transitData)) {
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

  // 정상 렌더 — 모드에 따라 분기
  if (transitData) {
    return <TransitGuideScreen data={transitData} endName={endName} />;
  }

  if (tmapResponse) {
    return (
      <NavigationScreen
        tmapResponse={tmapResponse}
        onNavigationEnd={() => navigation.goBack()}
      />
    );
  }

  return null;
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
