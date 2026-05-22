// src/components/guardian/ProtegeHeroCard.tsx

// 피보호자 정보 카드: 아바타 + 이름(관계) + 마지막 활동 + 활성 뱃지.

import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import type { Protege, ProtegeStatusType } from "../../types/guardianHome";

interface Props {
  protege: Protege;
}

function activeBadge(status: ProtegeStatusType): {
  label: string;
  bg: string;
  fg: string;
} {
  switch (status) {
    case "inside":
    case "outside":
      return {
        label: "활성",
        bg: "#E8F5E9",
        fg: Colors.semantic.success,
      };
    case "disconnected":
      return {
        label: "연결 끊김",
        bg: Colors.gray[100],
        fg: Colors.text.secondary,
      };
    case "unknown":
    default:
      return {
        label: "확인 중",
        bg: Colors.gray[100],
        fg: Colors.text.secondary,
      };
  }
}

function formatLastActivity(minutesAgo: number | null): string {
  if (minutesAgo === null) return "활동 정보 없음";
  if (minutesAgo < 1) return "방금 전";
  if (minutesAgo < 60) return `${minutesAgo}분 전`;
  if (minutesAgo < 1440) return `${Math.floor(minutesAgo / 60)}시간 전`;
  return `${Math.floor(minutesAgo / 1440)}일 전`;
}

export function ProtegeHeroCard({ protege }: Props) {
  const badge = activeBadge(protege.status);
  const initial = protege.name.charAt(0);
  const subtitle =
    protege.relationship.length > 0
      ? `${protege.name} (${protege.relationship})`
      : protege.name;

  return (
    <View style={styles.card}>
      <View
        style={[styles.avatar, { backgroundColor: protege.avatarColor }]}
        accessible={false}
      >
        <AppText
          variant="bodyBold"
          audience="guardian"
          style={styles.avatarText}
        >
          {initial}
        </AppText>
      </View>

      <View style={styles.body}>
        <AppText
          variant="bodyBold"
          audience="guardian"
          color="primary"
          numberOfLines={1}
        >
          {subtitle}
        </AppText>
        <AppText
          variant="caption"
          audience="guardian"
          color="secondary"
          style={styles.activity}
        >
          마지막 활동: {formatLastActivity(protege.lastReportedMinutesAgo)}
        </AppText>
      </View>

      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <View
          style={[styles.dot, { backgroundColor: badge.fg }]}
          accessible={false}
        />
        <AppText
          variant="caption"
          audience="guardian"
          style={{ color: badge.fg, fontWeight: "700" }}
        >
          {badge.label}
        </AppText>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 56;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Elevation.sm,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.text.inverse,
    fontWeight: "700",
    fontSize: 22,
  },
  body: {
    flex: 1,
  },
  activity: {
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
