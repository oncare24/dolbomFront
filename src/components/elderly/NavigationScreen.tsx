// ============================================================
// NavigationScreen — 지도 풀스크린 + 오버레이 안내 (C안)
// ============================================================
// 학술 근거: Scientific Reports 2025.12 (Nature, 50-69세 N=40)
// - 지도 유지 (익숙한 패러다임) + 음성 안내 (인지 부담 감소)
// - 카메라 follow → 시각적 위치 파악 부담 감소
// - 경로 이탈 3초 지속 시 자동 재탐색
// - 진행방향 화살표 마커 (heading 기반)

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
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
const CARD_ADVANCE_THRESHOLD_M = 35; // 카드 전환 임계값
const NEAR_POINT_FOR_PASS_M = 50; // "근접" 판정 (지점 통과 보조)
const DISTANCE_INCREASE_TOLERANCE_M = 10; // 거리 증가 = 지점 통과
const OFF_ROUTE_THRESHOLD_M = 50; // 경로 이탈 거리
const OFF_ROUTE_REROUTE_DEBOUNCE_MS = 3000; // 3초 지속 시 재탐색
const GPS_ACCURACY_THRESHOLD_M = 100;
const GPS_INTERVAL_MS = 2000;
const GPS_DISTANCE_FILTER_M = 3;
const TTS_LANGUAGE = "ko-KR";
const TTS_RATE = 0.9;
const MAP_ZOOM = 17;
const CAMERA_DURATION_MS = 300;
const ARRIVAL_END_DELAY_MS = 3000;

interface Props {
  tmapResponse: TmapResponse;
  onNavigationEnd?: () => void;
  onReroute?: (current: { latitude: number; longitude: number }) => void;
}

export default function NavigationScreen({
  tmapResponse,
  onNavigationEnd,
  onReroute,
}: Props) {
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [distanceToNext, setDistanceToNext] = useState(0);
  const [isOffRoute, setIsOffRoute] = useState(false);

  const cardIndexRef = useRef(0);
  const routeRef = useRef<NavigationRoute | null>(null);
  const onNavigationEndRef = useRef(onNavigationEnd);
  const onRerouteRef = useRef(onReroute);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<any>(null);
  const prevDistRef = useRef<number>(Infinity);
  const offRouteSinceRef = useRef<number | null>(null);

  useEffect(() => {
    onNavigationEndRef.current = onNavigationEnd;
    onRerouteRef.current = onReroute;
  }, [onNavigationEnd, onReroute]);

  // ── Tmap 응답 파싱 (재탐색 시에도 호출됨) ──
  useEffect(() => {
    const parsed = parseTmapResponse(tmapResponse);
    routeRef.current = parsed;
    setRoute(parsed);
    cardIndexRef.current = 0;
    setCurrentCardIndex(0);
    prevDistRef.current = Infinity;
    offRouteSinceRef.current = null;
    setIsOffRoute(false);

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
        // 권한 없으면 길안내 자체 불가 → 화면 종료
        onNavigationEndRef.current?.();
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

  // ── GPS 업데이트 → 카메라 추적 + 카드 전환 + 경로 이탈 ──
  const handleLocationUpdate = useCallback(
    (coords: {
      latitude: number;
      longitude: number;
      accuracy: number | null;
      heading: number | null;
    }) => {
      // 1. GPS 정확도 필터링
      if (
        coords.accuracy != null &&
        coords.accuracy > GPS_ACCURACY_THRESHOLD_M
      ) {
        return;
      }

      const r = routeRef.current;
      if (!r || r.cards.length === 0) return;

      const { latitude, longitude } = coords;
      setCurrentLocation({ latitude, longitude });

      // heading: -1이면 정지/측정 불가 → 이전 값 유지
      if (coords.heading != null && coords.heading >= 0) {
        setCurrentHeading(coords.heading);
      }

      // 카메라 추적 (네이버지도 follow 모드)
      mapRef.current?.animateCameraTo({
        latitude,
        longitude,
        zoom: MAP_ZOOM,
        duration: CAMERA_DURATION_MS,
      });

      const cards = r.cards;
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
        prevDist < NEAR_POINT_FOR_PASS_M &&
        dist > prevDist + DISTANCE_INCREASE_TOLERANCE_M;

      if ((arrived || passed) && idx + 1 < cards.length) {
        const nextIdx = idx + 1;
        cardIndexRef.current = nextIdx;
        setCurrentCardIndex(nextIdx);
        prevDistRef.current = Infinity;

        speakCard(cards[nextIdx]);

        if (cards[nextIdx].pointType === "end") {
          setTimeout(
            () => onNavigationEndRef.current?.(),
            ARRIVAL_END_DELAY_MS,
          );
        }
      } else {
        prevDistRef.current = dist;
      }

      // 3. 경로 이탈 감지 + 디바운스 재탐색
      if (currentCard.pathCoords.length > 0) {
        const pathDist = distanceToPath(
          latitude,
          longitude,
          currentCard.pathCoords,
        );
        const off = pathDist > OFF_ROUTE_THRESHOLD_M;

        if (off) {
          setIsOffRoute(true);
          if (offRouteSinceRef.current === null) {
            offRouteSinceRef.current = Date.now();
          } else if (
            Date.now() - offRouteSinceRef.current >
            OFF_ROUTE_REROUTE_DEBOUNCE_MS
          ) {
            offRouteSinceRef.current = null;
            onRerouteRef.current?.({ latitude, longitude });
          }
        } else {
          setIsOffRoute(false);
          offRouteSinceRef.current = null;
        }
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

  if (route.cards.length === 0) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>경로 정보를 받을 수 없어요</Text>
      </View>
    );
  }

  const currentCard = route.cards[currentCardIndex];
  const nextCard =
    currentCardIndex + 1 < route.cards.length
      ? route.cards[currentCardIndex + 1]
      : null;
  const passedCoords = getPassedCoords();

  // 도착 예상 시각 ("오후 1시 32분 도착")
  const arrivalDate = new Date(Date.now() + route.totalDuration * 1000);
  const ah = arrivalDate.getHours();
  const am = arrivalDate.getMinutes();
  const period = ah < 12 ? "오전" : "오후";
  const displayH = ah === 0 ? 12 : ah > 12 ? ah - 12 : ah;
  const arrivalText = `${period} ${displayH}시 ${am}분 도착`;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* ── 지도 풀스크린 ── */}
      <NaverMapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialCamera={{
          latitude: route.cards[0].point.latitude,
          longitude: route.cards[0].point.longitude,
          zoom: MAP_ZOOM,
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
            width={10}
          />
        )}
        {/* 지나간 구간 */}
        {passedCoords.length > 1 && (
          <NaverMapPolylineOverlay
            coords={passedCoords}
            color={Colors.gray[400]}
            width={10}
          />
        )}
        {/* 안내지점 마커 */}
        {route.cards.filter(shouldShowMarker).map((card) => (
          <NaverMapMarkerOverlay
            key={`point-${card.index}`}
            latitude={card.point.latitude}
            longitude={card.point.longitude}
            image={{ symbol: "gray" }}
            width={32}
            height={42}
            anchor={{ x: 0.5, y: 1 }}
          />
        ))}
        {/* 현재 위치 — 진행방향 화살표 */}
        {currentLocation && (
          <NaverMapMarkerOverlay
            key="current-location"
            latitude={currentLocation.latitude}
            longitude={currentLocation.longitude}
            angle={currentHeading}
            width={48}
            height={48}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View collapsable={false} style={styles.locationMarker}>
              <Text style={styles.locationMarkerArrow}>▲</Text>
            </View>
          </NaverMapMarkerOverlay>
        )}
      </NaverMapView>

      {/* ── 상단 오버레이: 안내 카드 + 도착 정보 ── */}
      <View
        style={[styles.topOverlay, { paddingTop: insets.top + Spacing.sm }]}
        pointerEvents="box-none"
      >
        <NavigationCardUI
          currentCard={currentCard}
          nextCard={nextCard}
          distanceToNext={distanceToNext}
        />

        <View style={styles.arrivalChip}>
          <Text style={styles.arrivalText}>
            {formatDistance(route.totalDistance)} ·{" "}
            {formatDuration(route.totalDuration)} · {arrivalText}
          </Text>
        </View>

        {isOffRoute && (
          <View style={styles.offRouteBanner}>
            <Text style={styles.offRouteText}>경로를 다시 찾고 있어요</Text>
          </View>
        )}
      </View>

      {/* ── 하단 오버레이: 버튼 ── */}
      <View
        style={[
          styles.bottomOverlay,
          { paddingBottom: insets.bottom + Spacing.sm },
        ]}
        pointerEvents="box-none"
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
          <Text style={styles.closeText}>안내 종료</Text>
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

  // 사용자 위치 마커
  locationMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.brand.primary,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  locationMarkerArrow: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "900",
    lineHeight: 20,
  },

  // 상단 오버레이
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  arrivalChip: {
    alignSelf: "center",
    backgroundColor: Colors.surface.card,
    borderRadius: 999,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  arrivalText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
  offRouteBanner: {
    alignSelf: "center",
    backgroundColor: Colors.semantic.danger,
    borderRadius: Radius.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    elevation: 4,
  },
  offRouteText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.inverse,
    letterSpacing: 0.2,
  },

  // 하단 오버레이
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: Touch.senior,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
    backgroundColor: Colors.gray[700],
  },
  closeText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.inverse,
    letterSpacing: 0.2,
  },
});
