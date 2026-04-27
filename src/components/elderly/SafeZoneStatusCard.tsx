// 현재 안전구역 상태 카드.
// 안전구역 안: success 톤 / 밖: warning 톤.

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Spacing, Radius, Elevation } from "../../theme";
import type { SafeZoneStatus } from "../../types/elderlyHome";

interface Props {
  status: SafeZoneStatus;
}

export function SafeZoneStatusCard({ status }: Props) {
  const inside = status.isInside;

  const tone = inside
    ? {
        bg: Colors.semantic.successBg,
        icon: Colors.semantic.success,
        iconName: "shield-checkmark" as const,
        title: "안전 구역 안",
        sub: status.currentLabel,
      }
    : {
        bg: Colors.semantic.warningBg,
        icon: Colors.semantic.warning,
        iconName: "warning" as const,
        title: "안전 구역 밖",
        sub: status.currentLabel,
      };

  return (
    <View
      style={[styles.card, { backgroundColor: tone.bg }]}
      accessibilityLabel={`${tone.title}, ${tone.sub}`}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={tone.iconName} size={28} color={tone.icon} />
      </View>
      <View style={styles.textWrap}>
        <AppText variant="bodyBold" color="primary">
          {tone.title}
        </AppText>
        <AppText variant="caption" color="secondary" style={styles.sub}>
          {tone.sub}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Elevation.xs,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  sub: {
    marginTop: 2,
  },
});
