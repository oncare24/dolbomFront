// 화면 상단 — 피보호자 현재 상태 요약 배너.

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Spacing, Radius } from "../../theme";
import { formatRelativeMinutes } from "../../utils/timeFormat";
import type { ProtegeStatusType } from "../../types/guardianHome";

interface Props {
  status: ProtegeStatusType;
  locationLabel: string;
  lastReportedMinutesAgo: number | null; // ← number → number | null
}

interface BannerStyle {
  bg: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
}

const STATUS_MAP: Record<ProtegeStatusType, BannerStyle> = {
  inside: {
    bg: Colors.semantic.successBg,
    iconName: "shield-checkmark",
    iconColor: Colors.semantic.success,
    title: "현재 안전구역 안",
  },
  outside: {
    bg: Colors.semantic.warningBg,
    iconName: "warning",
    iconColor: Colors.semantic.warning,
    title: "현재 안전구역 밖",
  },
  disconnected: {
    bg: Colors.gray[100],
    iconName: "cloud-offline",
    iconColor: Colors.gray[600],
    title: "연결 끊김",
  },
  unknown: {
    // ← 추가
    bg: Colors.gray[100],
    iconName: "help-circle-outline",
    iconColor: Colors.gray[600],
    title: "확인 중",
  },
};

export function SafetyZoneStatusBanner({
  status,
  locationLabel,
  lastReportedMinutesAgo,
}: Props) {
  const style = STATUS_MAP[status];

  return (
    <View style={[styles.banner, { backgroundColor: style.bg }]}>
      <View style={styles.iconWrap}>
        <Ionicons name={style.iconName} size={22} color={style.iconColor} />
      </View>
      <View style={styles.textWrap}>
        <AppText variant="bodyBold" audience="guardian" color="primary">
          {style.title}
          <AppText variant="body" audience="guardian" color="secondary">
            {"  ·  "}
            {locationLabel}
          </AppText>
        </AppText>
        <AppText
          variant="caption"
          audience="guardian"
          color="secondary"
          style={styles.time}
        >
          마지막 보고 {formatRelativeMinutes(lastReportedMinutesAgo)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  textWrap: {
    flex: 1,
  },
  time: {
    marginTop: 2,
  },
});
