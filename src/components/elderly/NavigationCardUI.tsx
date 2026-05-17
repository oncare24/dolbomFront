// ============================================================
// NavigationCardUI — 시니어 가이드 카드
// ============================================================
// 메인 카드: 큰 아이콘 + "좌회전" + "30m 앞" (시인성 최대)
// 다음 카드: 보조 정보 (작게)

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { NavigationCard } from "../../types/navigation";
import { getTurnIcon } from "../../constants/turnTypeMap";
import { formatDistance } from "../../utils/haversine";
import { Colors, Spacing, Radius } from "../../theme";

interface Props {
  currentCard: NavigationCard;
  nextCard: NavigationCard | null;
  distanceToNext: number;
}

export default function NavigationCardUI({
  currentCard,
  nextCard,
  distanceToNext,
}: Props) {
  const icon = getTurnIcon(currentCard.turnType);
  const isArrived = currentCard.pointType === "end";

  return (
    <View style={styles.container}>
      {/* 메인 카드 — 다음 행동 하나만 강조 */}
      <View style={[styles.mainCard, isArrived && styles.arrivedCard]}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.turnLabel}>{currentCard.turnLabel}</Text>
        {!isArrived && distanceToNext > 0 && (
          <Text style={styles.distance}>
            {formatDistance(distanceToNext)} 앞
          </Text>
        )}
        {currentCard.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {currentCard.description}
          </Text>
        ) : null}
      </View>

      {/* 다음 카드 미리보기 — 보조 */}
      {nextCard && !isArrived && (
        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>다음</Text>
          <Text style={styles.nextIcon}>{getTurnIcon(nextCard.turnType)}</Text>
          <Text style={styles.nextTurn} numberOfLines={1}>
            {nextCard.turnLabel}
            {nextCard.distance > 0
              ? `  ${formatDistance(nextCard.distance)}`
              : ""}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  mainCard: {
    flex: 1,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  arrivedCard: {
    backgroundColor: Colors.semantic.success,
  },
  icon: {
    fontSize: 96,
    color: Colors.text.inverse,
    lineHeight: 110,
    marginBottom: Spacing.xs,
  },
  turnLabel: {
    fontSize: 44,
    fontWeight: "800",
    color: Colors.text.inverse,
    letterSpacing: 0.2,
    marginBottom: Spacing.xxs,
  },
  distance: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text.inverse,
    letterSpacing: 0.2,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 18,
    color: Colors.text.inverse,
    letterSpacing: 0.2,
    lineHeight: 28,
    textAlign: "center",
    paddingHorizontal: Spacing.sm,
    opacity: 0.95,
  },
  nextCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surface.divider,
  },
  nextLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  nextIcon: {
    fontSize: 28,
    color: Colors.text.primary,
  },
  nextTurn: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
});
