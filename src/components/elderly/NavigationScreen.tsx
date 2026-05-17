// ============================================================
// NavigationScreen — 카드 우선 시니어 길안내 화면
// ============================================================
// 비율: 미니맵 25% / 카드 65% / 버튼 10%
// 카드 자동 전환: 임계값 + GPS 필터 + 거리 증가(통과) 판정

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import {
  NaverMapView,
  NaverMapPolylineOverlay,
  NaverMapMarkerOverlay,
} from "@mj-studio/react-native-naver-map";

import type {
  TmapResponse,
  NavigationCard,
  NavigationRoute,
} from "../../types/navigation";
import { parseTmapResponse } from "../../utils/tmapCardParser";
import {
  haversine,
  distanceToPath,
  formatDistance,
  formatDuration,
} from "../../utils/haversine";
import NavigationCardUI from "./NavigationCardUI";
import { shouldShowMarker } from "../../utils/markerFilter";
import { Colors, Spacing, Radius, Touch } from "../../theme";

// ── 상수 ──
const CARD_ADVANCE_THRESHOLD_M = 35; // GPS 오차 대비 (20 → 35)
const DISTANCE_INCREASE_TOLERANCE_M = 10; // 거리 증가 = 지점 통과
const OFF_ROUTE_THRESHOLD_M = 50;
const GPS_ACCURACY_THRESHOLD_M = 100; // 부정확한 GPS 무시
const GPS_INTERVAL_MS = 3000;
const GPS_DISTANCE_FILTER_M = 5;
const TTS_LANGUAGE = "ko-KR";
const TTS_RATE = 0.9;

interface Props {
  tmapResponse: TmapResponse;
  onNavigationEnd?: () => void;
}

export default function NavigationScreen({
  tmapResponse,
  onNavigationEnd,
}: Props) {
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [distanceToNext, setDistanceToNext] = useState(0);
  const [isOffRoute, setIsOffRoute] = useState(false);

  const cardIndexRef = useRef(0);
  const routeRef = useRef<NavigationRoute | null>(null);
  const onNavigationEndRef = useRef(onNavigationEnd);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<any>(null);
  const prevDistRef = useRef<number>(Infinity);

  useEffect(() => {
    onNavigationEndRef.current = onNavigationEnd;
  }, [onNavigationEnd]);

  // ── Tmap 응답 파싱 ──
  useEffect(() => {
    const parsed = parseTmapResponse(tmapResponse);
    routeRef.current = parsed;
    setRoute(parsed);
    cardIndexRef.current = 0;
    setCurrentCardIndex(0);
    prevDistRef.current = Infinity;

    if (parsed.cards.length > 0) {
      speakCard(parsed.cards[0]);
    }
  }, [tmapResponse]);

  // ── GPS 실시간 추적 ──
  useEffect(() => {
    let isMounted = true;

    async function startGpsTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "위치 권한 필요",
          "길안내를 위해 위치 권한을 허용해주세요.",
        );
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: GPS_INTERVAL_MS,
          distanceInterval: GPS_DISTANCE_FILTER_M,
        },
        (location) => {
          if (!isMounted) return;
          handleLocationUpdate(location.coords);
        },
      );

      locationSubRef.current = subscription;
    }

    startGpsTracking();
    return () => {
      isMounted = false;
      locationSubRef.current?.remove();
      Speech.stop();
    };
  }, []);

  // ── GPS 업데이트 → 카드 전환 판정 ──
  const handleLocationUpdate = useCallback(
    (coords: {
      latitude: number;
      longitude: number;
      accuracy: number | null;
    }) => {
      // 1. GPS 정확도 필터링
      if (
        coords.accuracy != null &&
        coords.accuracy > GPS_ACCURACY_THRESHOLD_M
      ) {
        return;
      }

      const route = routeRef.current;
      if (!route) return;

      const { latitude, longitude } = coords;
      setCurrentLocation({ latitude, longitude });

      const cards = route.cards;
      const idx = cardIndexRef.current;
      if (idx >= cards.length) return;

      const currentCard = cards[idx];
      const targetCard = idx + 1 < cards.length ? cards[idx + 1] : currentCard;

      const dist = haversine(
        latitude,
        longitude,
        targetCard.point.latitude,
        targetCard.point.longitude,
      );
      setDistanceToNext(dist);

      // 2. 카드 전환 판정: 임계값 진입 OR 거리 증가(지나친 것)
      const prevDist = prevDistRef.current;
      const arrived = dist < CARD_ADVANCE_THRESHOLD_M;
      const passed =
        prevDist < OFF_ROUTE_THRESHOLD_M &&
        dist > prevDist + DISTANCE_INCREASE_TOLERANCE_M;

      if ((arrived || passed) && idx + 1 < cards.length) {
        const nextIdx = idx + 1;
        cardIndexRef.current = nextIdx;
        setCurrentCardIndex(nextIdx);
        prevDistRef.current = Infinity;

        console.log(`[Nav] 카드 전환: ${idx} → ${nextIdx}`);
        speakCard(cards[nextIdx]);

        if (cards[nextIdx].pointType === "end") {
          setTimeout(() => onNavigationEndRef.current?.(), 3000);
        }
        moveCamera(
          cards[nextIdx].point.latitude,
          cards[nextIdx].point.longitude,
        );
      } else {
        prevDistRef.current = dist;
      }

      // 3. 경로 이탈 감지
      if (currentCard.pathCoords.length > 0) {
        const pathDist = distanceToPath(
          latitude,
          longitude,
          currentCard.pathCoords,
        );
        setIsOffRoute(pathDist > OFF_ROUTE_THRESHOLD_M);
      }
    },
    [],
  );

  function speakCard(card: NavigationCard) {
    Speech.stop();
    Speech.speak(card.description || card.turnLabel, {
      language: TTS_LANGUAGE,
      rate: TTS_RATE,
    });
  }

  function moveCamera(latitude: number, longitude: number) {
    mapRef.current?.animateCameraTo({
      latitude,
      longitude,
      zoom: 17,
      duration: 500,
    });
  }

  function handleReplay() {
    if (!route) return;
    speakCard(route.cards[currentCardIndex]);
  }

  function handleClose() {
    Speech.stop();
    locationSubRef.current?.remove();
    onNavigationEndRef.current?.();
  }

  function getPassedCoords(): { latitude: number; longitude: number }[] {
    if (!route || currentCardIndex === 0) return [];
    const coords: { latitude: number; longitude: number }[] = [];
    for (let i = 0; i < currentCardIndex; i++) {
      coords.push(...route.cards[i].pathCoords);
    }
    return coords;
  }

  if (!route) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>경로를 준비하고 있어요</Text>
      </View>
    );
  }

  const currentCard = route.cards[currentCardIndex];
  const nextCard =
    currentCardIndex + 1 < route.cards.length
      ? route.cards[currentCardIndex + 1]
      : null;
  const passedCoords = getPassedCoords();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />

      {/* ── 미니맵 (25%) ── */}
      <View style={styles.mapContainer}>
        <NaverMapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialCamera={{
            latitude: route.cards[0]?.point.latitude ?? 36.1071,
            longitude: route.cards[0]?.point.longitude ?? 128.3516,
            zoom: 17,
          }}
          isShowLocationButton={false}
          isShowCompass={false}
          isShowScaleBar={false}
          isRotateGesturesEnabled={false}
          minZoom={14}
          maxZoom={19}
        >
          {/* 전체 경로 */}
          {route.fullPath.length > 1 && (
            <NaverMapPolylineOverlay
              coords={route.fullPath}
              color={Colors.brand.primary}
              width={8}
            />
          )}
          {/* 지나간 구간 */}
          {passedCoords.length > 1 && (
            <NaverMapPolylineOverlay
              coords={passedCoords}
              color={Colors.gray[400]}
              width={8}
            />
          )}
          {/* 안내지점 마커 — 캡션 제거, 끝이 좌표 가리킴 */}
          {route.cards.filter(shouldShowMarker).map((card) => (
            <NaverMapMarkerOverlay
              key={`point-${card.index}`}
              latitude={card.point.latitude}
              longitude={card.point.longitude}
              image={{ symbol: "gray" }}
              width={36}
              height={48}
              anchor={{ x: 0.5, y: 1 }}
            />
          ))}
          {/* 현재 위치 마커 — key 고정으로 깜빡거림 방지 */}
          {currentLocation && (
            <NaverMapMarkerOverlay
              key="current-location"
              latitude={currentLocation.latitude}
              longitude={currentLocation.longitude}
              image={{ symbol: "red" }}
              width={32}
              height={42}
              anchor={{ x: 0.5, y: 1 }}
            />
          )}
        </NaverMapView>

        {/* 상단 정보 바 */}
        <View style={styles.topBar}>
          <Text style={styles.topBarText}>
            {currentCardIndex + 1} / {route.cards.length} 구간
          </Text>
          <Text style={styles.topBarSub}>
            {formatDistance(route.totalDistance)} ·{" "}
            {formatDuration(route.totalDuration)}
          </Text>
        </View>

        {/* 경로 이탈 경고 */}
        {isOffRoute && (
          <View style={styles.offRouteWarning}>
            <Text style={styles.offRouteText}>경로에서 벗어났어요</Text>
          </View>
        )}
      </View>

      {/* ── 카드 영역 (65%) ── */}
      <View style={styles.cardArea}>
        {currentCard && (
          <NavigationCardUI
            currentCard={currentCard}
            nextCard={nextCard}
            distanceToNext={distanceToNext}
          />
        )}
      </View>

      {/* ── 버튼 영역 (10%) ── */}
      <View
        style={[
          styles.buttonRow,
          { paddingBottom: insets.bottom + Spacing.sm },
        ]}
      >
        <TouchableOpacity
          style={[styles.button, styles.replayButton]}
          onPress={handleReplay}
          activeOpacity={0.7}
        >
          <Text style={styles.replayText}>🔊 다시 듣기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.closeButton]}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeText}>안내 닫기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface.background,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  },

  // 미니맵 25%
  mapContainer: {
    flex: 0.25,
    position: "relative",
    backgroundColor: Colors.gray[100],
  },
  topBar: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  topBarText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
  topBarSub: {
    fontSize: 14,
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  },
  offRouteWarning: {
    position: "absolute",
    bottom: Spacing.xs,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.semantic.danger,
    borderRadius: Radius.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
  },
  offRouteText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.inverse,
    letterSpacing: 0.2,
  },

  // 카드 영역 65%
  cardArea: {
    flex: 0.65,
  },

  // 버튼 영역 10%
  buttonRow: {
    flex: 0.1,
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: Touch.senior, // 72dp
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  replayButton: {
    backgroundColor: Colors.surface.card,
    borderWidth: 2,
    borderColor: Colors.brand.primary,
  },
  replayText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.brand.primary,
    letterSpacing: 0.2,
  },
  closeButton: {
    backgroundColor: Colors.gray[300],
  },
  closeText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
});
