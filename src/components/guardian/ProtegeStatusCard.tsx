// 보호자 홈 — 피보호자 1명 상태 카드.
// 좌측 컬러 바(상태) + 이니셜 아바타 + 정보 + chevron 패턴 (Life360 차용).

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { AppText } from "../common/Text";
import { Colors, Spacing, Radius, Elevation } from "../../theme";
import { haptic } from "../../utils/haptics";
import { formatRelativeMinutes } from "../../utils/timeFormat";
import type { Protege, ProtegeStatusType } from "../../types/guardianHome";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  protege: Protege;
  onPress: () => void;
}

interface StatusStyle {
  barColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  labelColor: string;
}

const STATUS_MAP: Record<ProtegeStatusType, StatusStyle> = {
  inside: {
    barColor: Colors.semantic.success,
    iconName: "shield-checkmark",
    iconColor: Colors.semantic.success,
    label: "안전구역 안",
    labelColor: Colors.semantic.success,
  },
  outside: {
    barColor: Colors.semantic.warning,
    iconName: "warning",
    iconColor: Colors.semantic.warning,
    label: "안전구역 밖",
    labelColor: Colors.semantic.warning,
  },
  active: {
    barColor: Colors.brand.primary,
    iconName: "location-outline",
    iconColor: Colors.brand.primary,
    label: "위치 보고 중",
    labelColor: Colors.brand.primary,
  },
  disconnected: {
    barColor: Colors.gray[500],
    iconName: "cloud-offline",
    iconColor: Colors.gray[600],
    label: "연결 끊김",
    labelColor: Colors.gray[700],
  },
  unknown: {
    // ← 추가
    barColor: Colors.gray[400],
    iconName: "help-circle-outline",
    iconColor: Colors.gray[600],
    label: "확인 중",
    labelColor: Colors.gray[700],
  },
};

export function ProtegeStatusCard({ protege, onPress }: Props) {
  const scale = useSharedValue(1);
  const status = STATUS_MAP[protege.status];
  const isDisconnected = protege.status === "disconnected";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, {
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
      accessibilityLabel={`${protege.name}${
        protege.relationship ? " " + protege.relationship : ""
      }, ${status.label}, ${
        protege.locationLabel
      }, 마지막 보고 ${formatRelativeMinutes(protege.lastReportedMinutesAgo)}`}
      style={[styles.card, animatedStyle]}
    >
      {/* 좌측 컬러 바 (상태 강조) */}
      <View style={[styles.colorBar, { backgroundColor: status.barColor }]} />

      {/* 이니셜 아바타 */}
      <View style={[styles.avatar, { backgroundColor: protege.avatarColor }]}>
        <AppText audience="guardian" color="inverse" style={styles.avatarText}>
          {protege.name.charAt(0)}
        </AppText>
      </View>

      {/* 정보 영역 */}
      <View style={styles.info}>
        {/* 1행: 이름 + 관계 */}
        <View style={styles.nameRow}>
          <AppText
            variant="bodyBold"
            audience="guardian"
            color="primary"
            numberOfLines={1}
          >
            {protege.name}
          </AppText>
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            style={styles.relationship}
          >
            {protege.relationship || "(관계 미지정)"}
          </AppText>
        </View>

        {/* 2행: 상태 + 위치 */}
        <View style={styles.statusRow}>
          <Ionicons
            name={status.iconName}
            size={14}
            color={status.iconColor}
            style={styles.statusIcon}
          />
          <AppText
            variant="caption"
            audience="guardian"
            style={[styles.statusLabel, { color: status.labelColor }]}
            numberOfLines={1}
          >
            {status.label}
          </AppText>
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            style={styles.dot}
          >
            ·
          </AppText>
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            numberOfLines={1}
            style={styles.locationLabel}
          >
            {protege.locationLabel}
          </AppText>
        </View>

        {/* 3행: 시각 (연결끊김 시 굵게 강조) */}
        <AppText
          variant={isDisconnected ? "bodyBold" : "caption"}
          audience="guardian"
          color={isDisconnected ? "primary" : "secondary"}
          style={styles.time}
        >
          {isDisconnected
            ? `마지막 보고 ${formatRelativeMinutes(
                protege.lastReportedMinutesAgo,
              )}`
            : formatRelativeMinutes(protege.lastReportedMinutesAgo)}
        </AppText>
      </View>

      {/* 우측 chevron */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={Colors.text.disabled}
        style={styles.chevron}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
    overflow: "hidden",
    ...Elevation.sm,
  },
  colorBar: {
    width: 4,
    alignSelf: "stretch",
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  relationship: {
    marginLeft: Spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusLabel: {
    fontWeight: "600",
  },
  dot: {
    marginHorizontal: 6,
  },
  locationLabel: {
    flex: 1,
  },
  time: {
    marginTop: 0,
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
});
