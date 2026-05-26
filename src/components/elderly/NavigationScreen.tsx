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
import {
  speak as ttsSpeak,
  stop as ttsStop,
} from "../../services/tutorialSpeechService";
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
  passedCoordsUpTo,
} from "../../utils/haversine";
import NavigationCardUI from "./NavigationCardUI";
import { shouldShowMarker } from "../../utils/markerFilter";
import { Colors, Spacing, Radius, Touch } from "../../theme";
import { buildSeniorSpeech } from "../../utils/seniorGuide";

// ── 상수 ──
const CARD_ADVANCE_THRESHOLD_M = 50; // 도착 지점 도달 판정 (목적지 전용)
const NEAR_POINT_FOR_PASS_M = 30; // 통과 감지 범위
const DISTANCE_INCREASE_TOLERANCE_M = 6; // 최소 거리에서 이만큼 멀어지면 통과
const OFF_ROUTE_THRESHOLD_M = 30; // 경로 이탈 거리 (도보 기준)
const OFF_ROUTE_REROUTE_DEBOUNCE_MS = 2000; // 2초 지속 시 재탐색
const REROUTE_ACCURACY_THRESHOLD_M = 30; // 이탈 판정은 정확한 GPS일 때만 (헛재탐색 방지)
const GPS_ACCURACY_THRESHOLD_M = 100;
const GPS_INTERVAL_MS = 1000;
const GPS_DISTANCE_FILTER_M = 3;
const NEAR_ANNOUNCE_M = 35; // 다음 안내가 이만큼 가까우면 한 번만 안내 (예고 생략)
const ANNOUNCE_ACT_M = 15; // 코앞 — 실행 안내
const MAP_ZOOM = 18;
const MAP_TILT = 60; // 카메라 기울임(원근감) — 차량 내비처럼 앞을 보는 시야
const ARRIVAL_END_DELAY_MS = 3000;
const HEADING_DEADBAND_DEG = 15; // 이만큼 이상 방향이 바뀔 때만 회전(작은 GPS 흔들림 무시)
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
  const minDistRef = useRef<number>(Infinity);
  const offRouteSinceRef = useRef<number | null>(null);

  const previewSpokenRef = useRef(false);
  const actSpokenRef = useRef(false);
  const isInitialRouteRef = useRef(true); // 최초 경로 진입 여부 (재탐색과 구분)
  const isReroutingRef = useRef(false); // 재탐색 진행 중 — 새 경로 올 때까지 안내 멈춤

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
    minDistRef.current = Infinity;
    offRouteSinceRef.current = null;
    setIsOffRoute(false);
    isReroutingRef.current = false; // 새 경로 도착 → 재탐색 종료

    previewSpokenRef.current = true;
    actSpokenRef.current = true;
    // 시작 안내는 최초 1회만. 재탐색으로 새 경로가 와도 "출발하세요"를 다시 말하지 않음
    // (방금 나간 "경로를 벗어났어요" 음성을 끊지 않으려고)
    if (isInitialRouteRef.current && parsed.cards.length > 0) {
      speakCard(parsed.cards[0]);
    }
    isInitialRouteRef.current = false;
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
      ttsStop();
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
      // heading: 움직일 때만 갱신(정지 시 -1 → 마지막 방향 유지, 지도가 빙빙 안 돎)
      // 카메라 추적/회전/기울임은 아래 render의 controlled `camera` prop이 담당
      // 작은 흔들림(GPS 노이즈)은 무시하고, 방향이 실제로 바뀔 때만 회전 → 지도 덜 흔들림
      if (coords.heading != null && coords.heading >= 0) {
        const target = coords.heading;
        setCurrentHeading((prev) => {
          let diff = target - prev;
          while (diff > 180) diff -= 360;
          while (diff < -180) diff += 360;
          return Math.abs(diff) < HEADING_DEADBAND_DEG ? prev : target;
        });
      }

      // 재탐색 중에는 새 경로가 들어올 때까지 안내/카드전환 멈춤
      // (이탈 음성 보호 + 옛 경로·새 경로 안내 겹침 방지)
      if (isReroutingRef.current) return;

      const cards = r.cards;
      const idx = cardIndexRef.current;
      if (idx >= cards.length) return;

      // 지금 다가가는 안내 지점 = 현재 카드의 지점
      const currentCard = cards[idx];

      const dist = haversine(
        latitude,
        longitude,
        currentCard.point.latitude,
        currentCard.point.longitude,
      );
      setDistanceToNext(dist);

      // 지점까지 가장 가까웠던 거리 기록 (통과 판정 기준점)
      if (dist < minDistRef.current) minDistRef.current = dist;

      // 2. 음성 안내 — 회전 코앞에서 실행 안내 (예고는 구간 진입 시 announceOnEnter가 처리)
      announceByDistance(currentCard, dist);

      // 3. 카드 전환 판정
      const arrived = dist < CARD_ADVANCE_THRESHOLD_M;
      const passed =
        minDistRef.current < NEAR_POINT_FOR_PASS_M &&
        dist > minDistRef.current + DISTANCE_INCREASE_TOLERANCE_M;

      if (currentCard.pointType === "end") {
        if (arrived) {
          cardIndexRef.current = cards.length; // 이후 업데이트 무시
          ttsSpeak("도착했습니다. 안내를 마칠게요.");
          setTimeout(
            () => onNavigationEndRef.current?.(),
            ARRIVAL_END_DELAY_MS,
          );
        }
      } else if (passed && idx + 1 < cards.length) {
        const nextIdx = idx + 1;
        cardIndexRef.current = nextIdx;
        setCurrentCardIndex(nextIdx);
        minDistRef.current = Infinity;
        previewSpokenRef.current = false;
        actSpokenRef.current = false;

        // 구간을 지나면 즉시 다음 안내 (침묵 구간 제거)
        const enteredCard = cards[nextIdx];
        const enteredDist = haversine(
          latitude,
          longitude,
          enteredCard.point.latitude,
          enteredCard.point.longitude,
        );
        announceOnEnter(enteredCard, enteredDist);
      }

      // 4. 경로 이탈 감지 + 디바운스 재탐색 (정확한 GPS일 때만)
      const walkedCard = idx > 0 ? cards[idx - 1] : currentCard;
      if (walkedCard.pathCoords.length > 0) {
        const pathDist = distanceToPath(
          latitude,
          longitude,
          walkedCard.pathCoords,
        );
        const off = pathDist > OFF_ROUTE_THRESHOLD_M;
        const accurate =
          coords.accuracy != null &&
          coords.accuracy <= REROUTE_ACCURACY_THRESHOLD_M;

        if (off) {
          // 부정확한 측정으론 이탈로 단정하지 않음 (헛재탐색 방지)
          if (accurate) {
            setIsOffRoute(true);
            if (offRouteSinceRef.current === null) {
              offRouteSinceRef.current = Date.now();
            } else if (
              Date.now() - offRouteSinceRef.current >
              OFF_ROUTE_REROUTE_DEBOUNCE_MS
            ) {
              offRouteSinceRef.current = null;
              isReroutingRef.current = true;
              ttsSpeak("경로를 벗어났어요. 길을 다시 안내할게요.");
              onRerouteRef.current?.({ latitude, longitude });
            }
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
    ttsSpeak(card.speech || card.actionLabel);
  }

  // 구간 진입 시(직전 지점 통과 직후) 1회 안내.
  //  - 다음 지점이 코앞이면 실행 안내 한 번으로 끝 (중복 방지)
  //  - 멀면 예고만, 실행 안내는 코앞에서 announceByDistance가 처리
  function announceOnEnter(card: NavigationCard, dist: number) {
    const base = card.speech || card.actionLabel;
    if (dist <= NEAR_ANNOUNCE_M) {
      previewSpokenRef.current = true;
      actSpokenRef.current = true;
      ttsSpeak(base);
    } else {
      previewSpokenRef.current = true;
      // 건물명 있으면 문장에 이미 들어있음 / 없으면 거리 대신 말로
      const headsUp =
        card.pointType === "end" || card.landmark
          ? base
          : `조금 더 가서 ${base}`;
      ttsSpeak(headsUp);
    }
  }

  // 회전 코앞에서 실행 안내. 예고(건물명 포함)와 겹치지 않게 여기선 짧게(건물명 없이).
  //  예) 예고 "세븐일레븐에서 오른쪽으로 도세요" → 실행 "오른쪽으로 도세요"
  function announceByDistance(card: NavigationCard, dist: number) {
    if (!actSpokenRef.current && dist <= ANNOUNCE_ACT_M) {
      actSpokenRef.current = true;
      previewSpokenRef.current = true;
      ttsSpeak(buildSeniorSpeech(card.turnType, ""));
    }
  }

  function handleReplay() {
    if (!route) return;
    speakCard(route.cards[currentCardIndex]);
  }

  function handleClose() {
    ttsStop();
    locationSubRef.current?.remove();
    onNavigationEndRef.current?.();
  }

  function getPassedCoords(): { latitude: number; longitude: number }[] {
    if (!route || !currentLocation) return [];
    return passedCoordsUpTo(
      currentLocation.latitude,
      currentLocation.longitude,
      route.fullPath,
    );
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
        camera={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                zoom: MAP_ZOOM,
                tilt: MAP_TILT,
                bearing: currentHeading,
              }
            : undefined
        }
        isShowLocationButton={false}
        isShowCompass={false}
        isShowScaleBar={false}
        isRotateGesturesEnabled={false}
        animationDuration={500}
        animationEasing="Linear"
        minZoom={14}
        maxZoom={21}
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
        {/* 목적지 마커 — 빨강+라벨로 한눈에 (중간 꺾임 핀은 표시 안 함: 경로선+음성으로 안내) */}
        <NaverMapMarkerOverlay
          key="destination"
          latitude={route.cards[route.cards.length - 1].point.latitude}
          longitude={route.cards[route.cards.length - 1].point.longitude}
          image={{ symbol: "red" }}
          width={40}
          height={52}
          anchor={{ x: 0.5, y: 1 }}
          caption={{
            text: "목적지",
            textSize: 16,
            color: "#1A1A1A",
            haloColor: "#FFFFFF",
          }}
        />
        {/* 현재 위치 — 진행방향 화살표 */}
        {currentLocation && (
          <NaverMapMarkerOverlay
            key="current-location"
            latitude={currentLocation.latitude}
            longitude={currentLocation.longitude}
            angle={0}
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
    backgroundColor: Colors.semantic.warning,
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
