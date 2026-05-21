// ============================================================
// NavigationCardUI — 지도 위 오버레이 안내 카드 (C안)
// ============================================================
// 학술 권장 적용 (Scientific Reports 2025.12):
// - 다음 행동 1개만 강조
// - 거리 + 행동 ("48m 앞 좌회전")
// - 교차로명/장소명 보조 (Tmap description → 랜드마크 효과)

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
      {/* 메인 안내 — 다음 행동 하나만 강조 */}
      <View style={[styles.mainCard, isArrived && styles.cardArrived]}>
        <Text style={styles.mainIcon}>{icon}</Text>

        <View style={styles.textCol}>
          {!isArrived && distanceToNext > 0 && (
            <Text style={styles.distance}>
              {formatDistance(distanceToNext)} 앞
            </Text>
          )}
          <Text style={styles.turnLabel}>{currentCard.turnLabel}</Text>
          {currentCard.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {currentCard.description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* 다음 안내 미리보기 — 보조 */}
      {nextCard && !isArrived && (
        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>다음</Text>
          <Text style={styles.nextIcon}>{getTurnIcon(nextCard.turnType)}</Text>
          <Text style={styles.nextTurn} numberOfLines={1}>
            {nextCard.turnLabel}
            {nextCard.distance > 0
              ? ` · ${formatDistance(nextCard.distance)}`
              : ""}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  mainCard: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  cardArrived: {
    backgroundColor: Colors.semantic.success,
  },
  mainIcon: {
    fontSize: 56,
    color: Colors.text.inverse,
    lineHeight: 64,
  },
  textCol: {
    flex: 1,
  },
  distance: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.inverse,
    letterSpacing: 0.2,
    opacity: 0.9,
  },
  turnLabel: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.text.inverse,
    letterSpacing: 0.2,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: Colors.text.inverse,
    letterSpacing: 0.2,
    lineHeight: 20,
    opacity: 0.92,
    marginTop: 6,
  },
  nextCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  nextLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  },
  nextIcon: {
    fontSize: 20,
    color: Colors.text.primary,
  },
  nextTurn: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
});
