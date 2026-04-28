// 안전구역 목록 화면.
// 9-F: MOCK_PROTEGES 제거 → useMyWards lookup + FallbackProtege.
// Pull-to-refresh: 안전구역 + ward 상태(헤더·배너) 둘 다 동시 갱신.

import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { useToast } from "../../components/common/Toast";
import {
  SafetyZoneMapPreview,
  type SafetyZoneMapHandle,
} from "../../components/guardian/SafetyZoneMapPreview";
import { SafetyZoneStatusBanner } from "../../components/guardian/SafetyZoneStatusBanner";
import { SafetyZoneListItem } from "../../components/guardian/SafetyZoneListItem";
import { AddSafetyZoneCard } from "../../components/guardian/AddSafetyZoneCard";

import { MOCK_PROTEGE_LOCATION } from "../../mocks/safetyZoneMock";
import { SAFETY_ZONE_MAX_COUNT } from "../../types/safetyZone";
import {
  useSafetyZones,
  useToggleSafetyZoneNotification,
} from "../../hooks/useSafetyZones";
import { useMyWards } from "../../hooks/useMyWards";
import { Colors, Spacing } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";
import type { ProtegeStatusType } from "../../types/guardianHome";
import type { SafetyZone } from "../../types/safetyZone";

type Route = RouteProp<RootStackParamList, "SafetyZoneList">;
type Nav = NativeStackNavigationProp<RootStackParamList, "SafetyZoneList">;

// ward 데이터가 도착하기 전 / 매칭 실패 시 fallback.
type FallbackProtege = {
  name: string;
  status: ProtegeStatusType;
  locationLabel: string;
  lastReportedMinutesAgo: number | null;
};

const FALLBACK_PROTEGE: FallbackProtege = {
  name: "어르신",
  status: "unknown",
  locationLabel: "정보를 불러오는 중",
  lastReportedMinutesAgo: null,
};

export default function SafetyZoneListScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const mapRef = useRef<SafetyZoneMapHandle>(null);

  const protegeId = route.params?.protegeId;

  // 실 ward 정보 조회 (이름·상태·위치라벨 모두 여기서 가져옴)
  const { data: wards = [], refetch: refetchWards } = useMyWards();
  const protege = wards.find((w) => w.id === protegeId);
  const display = protege ?? FALLBACK_PROTEGE;

  // 안전구역 조회
  const {
    data: zones,
    isLoading,
    isError,
    refetch: refetchZones,
  } = useSafetyZones(protegeId);
  const toggleMutation = useToggleSafetyZoneNotification();

  const safeZones = zones ?? [];
  const isFull = safeZones.length >= SAFETY_ZONE_MAX_COUNT;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchZones(), refetchWards()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchZones, refetchWards]);

  const handleZonePress = (zone: SafetyZone) => {
    mapRef.current?.focusZone(zone);
    navigation.navigate("SafetyZoneEdit", {
      protegeId,
      zoneId: zone.id,
    });
  };

  const handleToggle = (zoneId: number, enabled: boolean) => {
    toggleMutation.mutate(
      { id: zoneId, enabled },
      {
        onSuccess: () => {
          toast.show({
            message: enabled ? "이탈 알림을 켰습니다" : "이탈 알림을 껐습니다",
            variant: enabled ? "success" : "info",
            durationMs: 1500,
          });
        },
        onError: () => {
          toast.show({
            message: "알림 설정을 바꾸지 못했어요",
            variant: "error",
          });
        },
      },
    );
  };

  const handleAddPress = () => {
    navigation.navigate("SafetyZoneEdit", { protegeId });
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />

      <View style={{ paddingTop: insets.top }}>
        <AppHeader title={`${display.name}님 안전구역`} audience="guardian" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.brand.primary]}
            tintColor={Colors.brand.primary}
          />
        }
      >
        <SafetyZoneMapPreview
          ref={mapRef}
          zones={safeZones}
          currentLocation={MOCK_PROTEGE_LOCATION}
        />

        <View style={styles.body}>
          <SafetyZoneStatusBanner
            status={display.status}
            locationLabel={display.locationLabel}
            lastReportedMinutesAgo={display.lastReportedMinutesAgo}
          />

          <View style={styles.sectionHeader}>
            <AppText variant="bodyBold" audience="guardian" color="primary">
              등록된 안전구역
            </AppText>
            <AppText
              variant="caption"
              audience="guardian"
              color={isFull ? "danger" : "secondary"}
              style={styles.countLabel}
            >
              {safeZones.length} / {SAFETY_ZONE_MAX_COUNT}
            </AppText>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.brand.primary} />
            </View>
          ) : isError ? (
            <View style={styles.errorBox}>
              <AppText variant="body" audience="guardian" color="secondary">
                안전구역을 불러오지 못했어요
              </AppText>
            </View>
          ) : (
            <View style={styles.list}>
              {safeZones.map((z) => (
                <SafetyZoneListItem
                  key={z.id}
                  zone={z}
                  onPress={() => handleZonePress(z)}
                  onToggleNotification={(enabled) =>
                    handleToggle(z.id, enabled)
                  }
                />
              ))}
              <AddSafetyZoneCard onPress={handleAddPress} disabled={isFull} />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  body: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  countLabel: {
    fontWeight: "600",
  },
  list: {
    gap: Spacing.sm,
  },
  loadingBox: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  errorBox: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
});
