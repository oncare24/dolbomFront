// src/components/guardian/ProtegeLocationCard.tsx

// 현재 위치 + 안전구역 상태 + 마지막 업데이트.
// 카드 전체 탭 = SafetyZoneList 진입.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";
import type { ProtegeStatusType } from "../../types/guardianHome";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  status: ProtegeStatusType;
  locationLabel: string;
  lastReportedMinutesAgo: number | null;
  onPress: () => void;
}

function statusInfo(status: ProtegeStatusType): {
  label: string;
  bg: string;
  fg: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  switch (status) {
    case "inside":
      return {
        label: "안전구역 내",
        bg: "#E8F5E9",
        fg: Colors.semantic.success,
        icon: "checkmark-circle",
      };
    case "outside":
      return {
        label: "안전구역 외부",
        bg: "#FFF3E0",
        fg: Colors.semantic.warning,
        icon: "warning",
      };
    case "active":
      return {
        label: "위치 보고 중",
        bg: Colors.brand.primaryLight,
        fg: Colors.brand.primary,
        icon: "location-outline",
      };
    case "disconnected":
      return {
        label: "연결 끊김",
        bg: Colors.gray[100],
        fg: Colors.text.secondary,
        icon: "cellular-outline",
      };
    case "unknown":
    default:
      return {
        label: "위치 확인 중",
        bg: Colors.gray[100],
        fg: Colors.text.secondary,
        icon: "help-circle-outline",
      };
  }
}

function formatLastReport(minutesAgo: number | null): string {
  if (minutesAgo === null) return "위치 보고 없음";
  if (minutesAgo < 1) return "방금 업데이트";
  if (minutesAgo < 60) return `${minutesAgo}분 전 업데이트`;
  if (minutesAgo < 1440)
    return `${Math.floor(minutesAgo / 60)}시간 전 업데이트`;
  return `${Math.floor(minutesAgo / 1440)}일 전 업데이트`;
}

export function ProtegeLocationCard({
  status,
  locationLabel,
  lastReportedMinutesAgo,
  onPress,
}: Props) {
  const info = statusInfo(status);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, {
      duration: 120,
      easing: Easing.out(Easing.quad),
    });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
  };
  const handlePress = () => {
    haptic.light();
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: Colors.gray[200], borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={`현재 위치, ${info.label}, ${locationLabel}, 전체보기`}
      style={[styles.card, animatedStyle]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="location" size={20} color={Colors.brand.primary} />
          <AppText variant="bodyBold" audience="guardian" color="primary">
            현재 위치
          </AppText>
        </View>

        <View style={[styles.badge, { backgroundColor: info.bg }]}>
          <Ionicons name={info.icon} size={14} color={info.fg} />
          <AppText
            variant="caption"
            audience="guardian"
            style={{ color: info.fg, fontWeight: "700" }}
          >
            {info.label}
          </AppText>
        </View>
      </View>

      <AppText
        variant="body"
        audience="guardian"
        color="primary"
        style={styles.locationLabel}
        numberOfLines={2}
      >
        {locationLabel}
      </AppText>

      <View style={styles.footer}>
        <AppText variant="caption" audience="guardian" color="secondary">
          {formatLastReport(lastReportedMinutesAgo)}
        </AppText>
        <View style={styles.action}>
          <AppText
            variant="caption"
            audience="guardian"
            style={styles.actionText}
          >
            전체보기
          </AppText>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={Colors.brand.primary}
          />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Elevation.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
  },
  locationLabel: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: Colors.brand.primary,
    fontWeight: "600",
  },
});
