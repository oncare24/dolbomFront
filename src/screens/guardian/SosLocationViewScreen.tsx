// 보호자 SOS 위치 보기 화면.
//
// 진입 경로:
//   1) 알림센터에서 SOS 카드 탭 → navigate("SosLocationView", { eventId })
//   2) (향후) 백그라운드 알림 탭 시 자동 라우팅 — 발표 후 백로그
//
// 화면 구성 (Life360 패턴 차용):
//   - 헤더: "긴급 호출 - {피보호자 이름}"
//   - 지도 (NaverMap, 좌표가 있으면 빨간 핀 + 50m 원)
//   - 하단 정보 카드: 호출 시각 + 위치 출처(CLIENT/FALLBACK/NONE 안내)
//   - 액션 버튼 2개:
//       · "{이름}에게 전화" (Linking.openURL("tel:..."))
//       · "지도 앱에서 길찾기" (네이버지도 외부 링크)
//
// 좌표 없는 경우 (locationSource=NONE):
//   - 지도 자리에 안내 메시지 ("위치 정보를 받지 못했어요")
//   - 길찾기 버튼은 비활성화, 전화 버튼만 강조
//
// 시간 표시: "방금 전" / "5분 전" / "1시간 전" 식 상대 시간 (timeFormat 유틸 활용).

import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapCircleOverlay,
} from "@mj-studio/react-native-naver-map";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "../../components/common/Header";
import { ScreenContainer } from "../../components/common/Layout";
import { AppText } from "../../components/common/Text";
import { getSosEvent } from "../../services/sosService";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";
import type { RootStackParamList } from "../../types/navigation";

type Route = RouteProp<RootStackParamList, "SosLocationView">;
type Nav = NativeStackNavigationProp<RootStackParamList, "SosLocationView">;

export default function SosLocationViewScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { eventId } = route.params;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["sosEvent", eventId],
    queryFn: () => getSosEvent(eventId),
    staleTime: 30 * 1000, // SOS는 자주 갱신 X — 30초 캐시
  });

  // ─── 액션 ─────────────────────────────────
  const callWard = useCallback(() => {
    if (!data?.wardPhone) return;
    haptic.medium();
    Linking.openURL(`tel:${data.wardPhone}`).catch(() => {
      Alert.alert("연결 실패", "전화 앱을 열 수 없어요.");
    });
  }, [data?.wardPhone]);

  // ─── 로딩/에러 ────────────────────────────
  if (isLoading) {
    return (
      <ScreenContainer audience="guardian" paddingTop={0} noPadding>
        <AppHeader title="긴급 호출" audience="guardian" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (isError || !data) {
    return (
      <ScreenContainer audience="guardian" paddingTop={0} noPadding>
        <AppHeader title="긴급 호출" audience="guardian" />
        <View style={styles.center}>
          <AppText variant="body" audience="guardian" color="danger">
            정보를 불러오지 못했어요.
          </AppText>
          <Pressable
            onPress={() => refetch()}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
          >
            <AppText variant="bodyBold" audience="guardian" color="inverse">
              다시 시도
            </AppText>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const hasLocation = data.latitude != null && data.longitude != null;

  return (
    <ScreenContainer audience="guardian" paddingTop={0} noPadding>
      <AppHeader title={`긴급 호출 - ${data.wardName}`} audience="guardian" />

      {/* 지도 영역 */}
      <View style={styles.mapWrap}>
        {hasLocation ? (
          <NaverMapView
            style={styles.map}
            initialCamera={{
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
              zoom: 16,
            }}
            isShowLocationButton={false}
            isShowCompass={false}
            isShowScaleBar={false}
            minZoom={10}
            maxZoom={19}
          >
            {/* 50m 강조 원 */}
            <NaverMapCircleOverlay
              latitude={Number(data.latitude)}
              longitude={Number(data.longitude)}
              radius={50}
              color="rgba(183, 28, 28, 0.18)"
              outlineColor={Colors.semantic.danger}
              outlineWidth={2}
            />
            {/* 빨간 SOS 핀 */}
            <NaverMapMarkerOverlay
              latitude={Number(data.latitude)}
              longitude={Number(data.longitude)}
              caption={{
                text: `${data.wardName}님`,
                textSize: 13,
                color: "#000000",
                haloColor: "#FFFFFF",
              }}
              width={36}
              height={36}
              anchor={{ x: 0.5, y: 0.5 }}
            />
          </NaverMapView>
        ) : (
          <View style={[styles.map, styles.noLocation]}>
            <Ionicons
              name="location-outline"
              size={48}
              color={Colors.text.disabled}
            />
            <AppText
              variant="body"
              audience="guardian"
              color="secondary"
              style={styles.noLocationText}
            >
              위치 정보를 받지 못했어요
            </AppText>
          </View>
        )}
      </View>

      {/* 하단 정보 + 액션 카드 */}
      <View style={styles.bottomCard}>
        <View style={styles.metaRow}>
          <Ionicons
            name="time-outline"
            size={18}
            color={Colors.text.secondary}
          />
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            style={styles.metaText}
          >
            {formatRelativeTime(data.createdAt)} ·{" "}
            {locationSourceLabel(data.locationSource)}
          </AppText>
        </View>

        <Pressable
          onPress={callWard}
          accessibilityRole="button"
          accessibilityLabel={`${data.wardName}에게 전화`}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Ionicons name="call" size={22} color={Colors.text.inverse} />
          <AppText
            variant="bodyBold"
            audience="guardian"
            color="inverse"
            style={styles.buttonLabel}
          >
            {data.wardName}에게 전화
          </AppText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

// ──────────────────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return "방금 전";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
  return `${Math.floor(diffSec / 86400)}일 전`;
}

function locationSourceLabel(source: string): string {
  switch (source) {
    case "CLIENT":
      return "실시간 위치";
    case "FALLBACK":
      return "최근 보고된 위치";
    case "NONE":
    default:
      return "위치 정보 없음";
  }
}

// ──────────────────────────────────────────────────────────
// 스타일
// ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.md,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },

  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  noLocation: {
    backgroundColor: Colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  noLocationText: {
    marginTop: Spacing.sm,
  },

  bottomCard: {
    backgroundColor: Colors.surface.card,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    ...Elevation.lg,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  metaText: {
    marginLeft: Spacing.xxs,
  },

  primaryButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.semantic.danger,
    alignItems: "center",
    justifyContent: "center",
    ...Elevation.sm,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },

  buttonLabel: {
    marginLeft: Spacing.xs,
  },
});
