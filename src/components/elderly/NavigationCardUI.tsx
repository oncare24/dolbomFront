// ============================================================
// NavigationCardUI — 길안내 카드 컴포넌트
// ============================================================
// 화면 하단: 큰 카드(현재 안내) + 작은 카드(다음 미리보기)
// 고령자 대상: 글씨 크게, 대비 강하게, 아이콘 크게

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { NavigationCard } from "../../types/navigation";
import { getTurnIcon } from "../../constants/turnTypeMap";
import { formatDistance, formatDuration } from "../../utils/haversine";

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
      {/* ── 현재 카드 ── */}
      <View style={[styles.mainCard, isArrived && styles.arrivedCard]}>
        <View style={styles.mainCardHeader}>
          <Text style={styles.turnIcon}>{icon}</Text>
          <View style={styles.headerText}>
            <Text style={styles.turnLabel}>{currentCard.turnLabel}</Text>
            {distanceToNext > 0 && !isArrived && (
              <Text style={styles.distanceText}>
                {formatDistance(distanceToNext)}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {currentCard.description}
        </Text>

        {currentCard.distance > 0 && (
          <Text style={styles.segmentInfo}>
            이 구간 {formatDistance(currentCard.distance)} ·{" "}
            {formatDuration(currentCard.duration)}
          </Text>
        )}
      </View>

      {/* ── 다음 카드 미리보기 ── */}
      {nextCard && (
        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>다음</Text>
          <Text style={styles.nextIcon}>{getTurnIcon(nextCard.turnType)}</Text>
          <Text style={styles.nextTurn} numberOfLines={1}>
            {nextCard.turnLabel}
          </Text>
          {nextCard.distance > 0 && (
            <Text style={styles.nextDistance}>
              {formatDistance(nextCard.distance)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  mainCard: {
    backgroundColor: "#1B5E20",
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  arrivedCard: {
    backgroundColor: "#1565C0",
  },
  mainCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  turnIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  turnLabel: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  distanceText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#A5D6A7",
  },
  description: {
    fontSize: 18,
    color: "#E8F5E9",
    lineHeight: 26,
  },
  segmentInfo: {
    fontSize: 14,
    color: "#81C784",
    marginTop: 8,
  },
  nextCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  nextLabel: {
    fontSize: 12,
    color: "#9E9E9E",
    fontWeight: "600",
  },
  nextIcon: {
    fontSize: 18,
  },
  nextTurn: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  nextDistance: {
    fontSize: 14,
    color: "#B0BEC5",
  },
});
