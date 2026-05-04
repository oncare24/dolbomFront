// ============================================================
// NavigationScreen — 카드 길안내 메인 화면 (완성판)
// ============================================================
// NaverMap 폴리라인 + 현재위치 마커 + 안내지점 마커 추가
// Tmap 실제 API와 Mock 데이터 둘 다 지원

import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Alert } from "react-native";
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
import NavigationCardUI from "../../components/elderly/NavigationCardUI";
import { shouldShowMarker } from "../../utils/markerFilter";

// ── 상수 ──
const CARD_ADVANCE_THRESHOLD_M = 20;
const OFF_ROUTE_THRESHOLD_M = 50;
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

  // onNavigationEnd가 부모에서 인라인 함수로 넘어오므로 ref 동기화
  useEffect(() => {
    onNavigationEndRef.current = onNavigationEnd;
  }, [onNavigationEnd]);

  // ── 1. Tmap 응답 파싱 ──
  useEffect(() => {
    const parsed = parseTmapResponse(tmapResponse);
    routeRef.current = parsed; // 추가
    setRoute(parsed);

    cardIndexRef.current = 0; // 추가
    setCurrentCardIndex(0); // 추가

    console.log(
      `[Nav] 파싱 완료: ${parsed.cards.length}장, ` +
        `${formatDistance(parsed.totalDistance)}, ${formatDuration(parsed.totalDuration)}`,
    );

    if (parsed.cards.length > 0) {
      speakCard(parsed.cards[0]);
    }
  }, [tmapResponse]);

  // ── 2. GPS 실시간 추적 ──
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

  // ── 3. GPS 업데이트 → 카드 전환 판정 ──
  const handleLocationUpdate = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      const route = routeRef.current; // 변경: ref에서 읽기
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

      if (dist < CARD_ADVANCE_THRESHOLD_M && idx + 1 < cards.length) {
        const nextIdx = idx + 1;
        cardIndexRef.current = nextIdx;
        setCurrentCardIndex(nextIdx);

        console.log(
          `[Nav] 카드 전환: ${idx} → ${nextIdx} (${cards[nextIdx].turnLabel})`,
        );
        speakCard(cards[nextIdx]);

        if (cards[nextIdx].pointType === "end") {
          setTimeout(() => onNavigationEndRef.current?.(), 3000); // 변경
        }

        moveCamera(
          cards[nextIdx].point.latitude,
          cards[nextIdx].point.longitude,
        );
      }

      if (currentCard.pathCoords.length > 0) {
        const pathDist = distanceToPath(
          latitude,
          longitude,
          currentCard.pathCoords,
        );
        setIsOffRoute(pathDist > OFF_ROUTE_THRESHOLD_M);
      }
    },
    [], // 변경: 빈 배열
  );

  // ── TTS ──
  function speakCard(card: NavigationCard) {
    Speech.stop();
    Speech.speak(card.description || card.turnLabel, {
      language: TTS_LANGUAGE,
      rate: TTS_RATE,
    });
  }

  // ── 카메라 이동 ──
  function moveCamera(latitude: number, longitude: number) {
    mapRef.current?.animateCameraTo({
      latitude,
      longitude,
      zoom: 17,
      duration: 500,
    });
  }

  // ── 다시 듣기 ──
  function handleReplay() {
    if (!route) return;
    speakCard(route.cards[currentCardIndex]);
  }

  // ── 지나간 구간 좌표 모으기 (회색 폴리라인용) ──
  function getPassedCoords(): { latitude: number; longitude: number }[] {
    if (!route || currentCardIndex === 0) return [];
    const coords: { latitude: number; longitude: number }[] = [];
    for (let i = 0; i < currentCardIndex; i++) {
      coords.push(...route.cards[i].pathCoords);
    }
    return coords;
  }

  // ── 렌더링 ──
  if (!route) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>경로 준비 중...</Text>
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
    <View style={styles.container}>
      {/* ── Naver 지도 ── */}
      <NaverMapView
        ref={mapRef}
        style={styles.map}
        initialCamera={{
          latitude: route.cards[0]?.point.latitude ?? 36.1071,
          longitude: route.cards[0]?.point.longitude ?? 128.3516,
          zoom: 17,
        }}
        isShowLocationButton={false}
        isShowCompass={true}
        isShowScaleBar={false}
        isRotateGesturesEnabled={true}
        minZoom={10}
        maxZoom={20}
      >
        {/* ── 전체 경로 폴리라인 (파란 선) ── */}
        {route.fullPath.length > 1 && (
          <NaverMapPolylineOverlay
            coords={route.fullPath}
            color="#1565C0"
            width={6}
          />
        )}

        {/* ── 이미 지나간 구간 (회색으로 덮어그림) ── */}
        {passedCoords.length > 1 && (
          <NaverMapPolylineOverlay
            coords={passedCoords}
            color="#9E9E9E"
            width={6}
          />
        )}

        {/* ── 안내지점 마커들 ── */}
        {route.cards.filter(shouldShowMarker).map((card) => (
          <NaverMapMarkerOverlay
            key={`point-${card.index}`}
            latitude={card.point.latitude}
            longitude={card.point.longitude}
            caption={{
              text: card.turnLabel,
              textSize: 12,
              color: "#000000",
              haloColor: "#FFFFFF",
            }}
            width={24}
            height={24}
            anchor={{ x: 0.5, y: 0.5 }}
          />
        ))}

        {/* ── 현재 위치 마커 (파란 점) ── */}
        {currentLocation && (
          <NaverMapMarkerOverlay
            latitude={currentLocation.latitude}
            longitude={currentLocation.longitude}
            caption={{
              text: "현재 위치",
              textSize: 11,
              color: "#1565C0",
              haloColor: "#FFFFFF",
            }}
            width={20}
            height={20}
            anchor={{ x: 0.5, y: 0.5 }}
          />
        )}
      </NaverMapView>

      {/* ── 상단 요약 ── */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>
          {formatDistance(route.totalDistance)} ·{" "}
          {formatDuration(route.totalDuration)}
        </Text>
        <Text style={styles.topBarSubText}>
          {currentCardIndex + 1} / {route.cards.length} 구간
        </Text>
      </View>

      {/* ── 경로 이탈 경고 ── */}
      {isOffRoute && (
        <View style={styles.offRouteWarning}>
          <Text style={styles.offRouteText}>경로를 이탈했습니다</Text>
        </View>
      )}

      {/* ── 다시 듣기 버튼 ── */}
      <TouchableOpacity style={styles.replayButton} onPress={handleReplay}>
        <Text style={styles.replayButtonText}>🔊 다시 듣기</Text>
      </TouchableOpacity>

      {/* ── 카드 UI ── */}
      {currentCard && (
        <NavigationCardUI
          currentCard={currentCard}
          nextCard={nextCard}
          distanceToNext={distanceToNext}
        />
      )}

      {/* ── 종료 버튼 ── */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          Speech.stop();
          locationSubRef.current?.remove();
          onNavigationEndRef.current?.(); // 변경
        }}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  topBar: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 80,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  topBarSubText: { color: "#B0BEC5", fontSize: 14 },
  offRouteWarning: {
    position: "absolute",
    top: 112,
    left: 16,
    right: 16,
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  offRouteText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  replayButton: {
    position: "absolute",
    top: 112,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  replayButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  closeButton: {
    position: "absolute",
    top: 56,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  loadingText: { color: "#FFFFFF", fontSize: 18 },
});
