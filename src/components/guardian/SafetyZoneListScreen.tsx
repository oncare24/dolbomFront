// 안전구역 목록 화면.
// 상단 NaverMap (모든 안전구역 + 현재위치) → 상태 배너 → 안전구역 카드 리스트.
// 카드 탭 → 지도 카메라 이동 + 수정 화면 진입(toast).

import React, { useRef, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, View } from "react-native";
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
import { MOCK_PROTEGES } from "../../mocks/guardianHomeMock";
import {
  MOCK_SAFETY_ZONES,
  MOCK_PROTEGE_LOCATION,
} from "../../mocks/safetyZoneMock";
import { SAFETY_ZONE_MAX_COUNT } from "../../types/safetyZone";
import { Colors, Spacing } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";
import type { SafetyZone } from "../../types/safetyZone";

type Route = RouteProp<RootStackParamList, "SafetyZoneList">;
type Nav = NativeStackNavigationProp<RootStackParamList, "SafetyZoneList">;

export default function SafetyZoneListScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>(); // ★ 추가
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const mapRef = useRef<SafetyZoneMapHandle>(null);
  const protegeId = route.params?.protegeId ?? 1;
  const protege =
    MOCK_PROTEGES.find((p) => p.id === protegeId) ?? MOCK_PROTEGES[0];

  // 해당 피보호자 안전구역만 필터 (Mock은 일단 protegeId=1만 있음)
  const initialZones = MOCK_SAFETY_ZONES.filter(
    (z) => z.protegeId === protege.id,
  );
  const [zones, setZones] = useState<SafetyZone[]>(initialZones);

  const isFull = zones.length >= SAFETY_ZONE_MAX_COUNT;

  const handleZonePress = (zone: SafetyZone) => {
    mapRef.current?.focusZone(zone);
    navigation.navigate("SafetyZoneEdit", {
      protegeId: protege.id,
      zoneId: zone.id,
    });
  };

  const handleToggle = (zoneId: number, enabled: boolean) => {
    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId ? { ...z, notificationEnabled: enabled } : z,
      ),
    );
    toast.show({
      message: enabled ? "이탈 알림을 켰습니다" : "이탈 알림을 껐습니다",
      variant: enabled ? "success" : "info",
      durationMs: 1500,
    });
  };

  const handleAddPress = () => {
    navigation.navigate("SafetyZoneEdit", { protegeId: protege.id });
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />

      <View style={{ paddingTop: insets.top }}>
        <AppHeader title={`${protege.name}님 안전구역`} audience="guardian" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. 미니 지도 */}
        <SafetyZoneMapPreview
          ref={mapRef}
          zones={zones}
          currentLocation={MOCK_PROTEGE_LOCATION}
        />

        {/* 2. 상태 배너 + 카드 리스트 (좌우 패딩) */}
        <View style={styles.body}>
          <SafetyZoneStatusBanner
            status={protege.status}
            locationLabel={protege.locationLabel}
            lastReportedMinutesAgo={protege.lastReportedMinutesAgo}
          />

          {/* 섹션 라벨 */}
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
              {zones.length} / {SAFETY_ZONE_MAX_COUNT}
            </AppText>
          </View>

          {/* 카드 리스트 */}
          <View style={styles.list}>
            {zones.map((z) => (
              <SafetyZoneListItem
                key={z.id}
                zone={z}
                onPress={() => handleZonePress(z)}
                onToggleNotification={(enabled) => handleToggle(z.id, enabled)}
              />
            ))}
            <AddSafetyZoneCard onPress={handleAddPress} disabled={isFull} />
          </View>
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
});
