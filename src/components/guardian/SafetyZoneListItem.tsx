// 안전구역 1개 카드. 좌측 타입 아이콘 / 중앙 정보 / 우측 알림 토글+chevron.

import React from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
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
import { getZoneVisual } from "../../utils/safetyZoneIcon";
import { formatRelativeMinutes } from "../../utils/timeFormat";
import type { SafetyZone } from "../../types/safetyZone";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  zone: SafetyZone;
  onPress: () => void;
  onToggleNotification: (enabled: boolean) => void;
}

export function SafetyZoneListItem({
  zone,
  onPress,
  onToggleNotification,
}: Props) {
  const scale = useSharedValue(1);
  const visual = getZoneVisual(zone.type);

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

  const handleToggle = (val: boolean) => {
    haptic.light();
    onToggleNotification(val);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: Colors.gray[200], borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={`${zone.name}, ${visual.label}, 반경 ${zone.radius}미터`}
      style={[styles.card, animatedStyle]}
    >
      {/* 타입 아이콘 */}
      <View style={[styles.iconWrap, { backgroundColor: visual.bgColor }]}>
        <Ionicons name={visual.iconName} size={26} color={visual.iconColor} />
      </View>

      {/* 정보 */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <AppText
            variant="bodyBold"
            audience="guardian"
            color="primary"
            numberOfLines={1}
          >
            {zone.name}
          </AppText>
          <View style={[styles.typeChip, { backgroundColor: visual.bgColor }]}>
            <AppText
              variant="caption"
              audience="guardian"
              style={{
                color: visual.iconColor,
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {visual.label}
            </AppText>
          </View>
        </View>

        <AppText
          variant="caption"
          audience="guardian"
          color="secondary"
          numberOfLines={1}
          style={styles.address}
        >
          {zone.address}
        </AppText>

        <View style={styles.metaRow}>
          <Ionicons
            name="resize"
            size={12}
            color={Colors.text.disabled}
            style={styles.metaIcon}
          />
          <AppText variant="caption" audience="guardian" color="secondary">
            반경 {zone.radius}m
          </AppText>
          {zone.lastVisitedMinutesAgo !== null && (
            <>
              <AppText
                variant="caption"
                audience="guardian"
                color="secondary"
                style={styles.metaDot}
              >
                ·
              </AppText>
              <AppText variant="caption" audience="guardian" color="secondary">
                최근 {formatRelativeMinutes(zone.lastVisitedMinutesAgo)} 방문
              </AppText>
            </>
          )}
        </View>
      </View>

      {/* 우측 알림 토글 */}
      <View style={styles.rightWrap}>
        <Switch
          value={zone.notificationEnabled}
          onValueChange={handleToggle}
          trackColor={{
            false: Colors.gray[300],
            true: Colors.brand.primaryLight,
          }}
          thumbColor={
            zone.notificationEnabled ? Colors.brand.primary : Colors.gray[500]
          }
        />
        <Ionicons
          name="chevron-forward"
          size={18}
          color={Colors.text.disabled}
          style={styles.chevron}
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    overflow: "hidden",
    ...Elevation.sm,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginLeft: Spacing.xs,
  },
  address: {
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaDot: {
    marginHorizontal: 6,
  },
  rightWrap: {
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
  chevron: {
    marginTop: 4,
  },
});
