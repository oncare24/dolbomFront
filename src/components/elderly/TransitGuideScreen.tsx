// 대중교통 길안내 화면.
//
// 도보 길안내(NavigationScreen)와 다른 점:
//   - 지도 + GPS 추적 없음
//   - 경로 카드를 위에서 아래로 흐름도처럼 표시
//   - 정류장 이름 / 버스 번호 / 환승 / 정거장 수 등 정보 풍부하게 표시
//
// 사용자 입장:
//   "어디서 타고 어디서 내리는지" 한눈에 보면 됨. 버스 안에 있을 땐
//   지도가 의미 없고 정확한 정류장 이름이 더 중요.

import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Colors, Spacing } from "../../theme";
import { AppHeader } from "../../components/common/Header";
import type {
  BackendTransitResponse,
  BackendNavigationCard,
} from "../../services/navigationService";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "HospitalNavigation">;

interface Props {
  /** 백엔드 대중교통 응답 (raw). HospitalNavigationScreen에서 전달. */
  data: BackendTransitResponse;
  /** 도착지 명칭 (병원명). 마지막 카드에 표시. */
  endName?: string;
}

export default function TransitGuideScreen({ data, endName }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  // START / ARRIVAL 카드는 시각적으로 처리. 본문은 WALK/BUS/SUBWAY만.
  const segments = data.cards.filter(
    (c) => c.type === "WALK" || c.type === "BUS" || c.type === "SUBWAY",
  );

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <AppHeader title="대중교통 안내" audience="elderly" />

      {/* ── 상단 요약 ── */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>총 소요 시간</Text>
        <Text style={styles.summaryTime}>
          약 {Math.round(data.totalTime / 60)}분
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>거리</Text>
            <Text style={styles.summaryValue}>
              {(data.totalDistance / 1000).toFixed(1)} km
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>요금</Text>
            <Text style={styles.summaryValue}>
              {data.totalFare ? `${data.totalFare.toLocaleString()}원` : "-"}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>환승</Text>
            <Text style={styles.summaryValue}>{data.transferCount}회</Text>
          </View>
        </View>
      </View>

      {/* ── 경로 카드 리스트 ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 출발 */}
        <RouteNode type="start" label="출발지" />

        {segments.map((card, idx) => {
          const isLast = idx === segments.length - 1;
          return (
            <View key={idx}>
              <RouteSegment card={card} />
              {/* 다음이 BUS/SUBWAY면 정류장 노드 표시 */}
              {!isLast && shouldShowStopNode(card, segments[idx + 1]) && (
                <RouteNode
                  type="stop"
                  label={getStopLabel(card, segments[idx + 1])}
                />
              )}
            </View>
          );
        })}

        {/* 도착 */}
        <RouteNode type="end" label={endName ?? "도착지"} />

        {/* 하단 여백 */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── 하단 닫기 버튼 ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeBtnText}>안내 닫기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────
//  세그먼트 (도보 / 버스 / 지하철)
// ──────────────────────────────────────────────

function RouteSegment({ card }: { card: BackendNavigationCard }) {
  if (card.type === "WALK") return <WalkSegment card={card} />;
  if (card.type === "BUS") return <BusSegment card={card} />;
  if (card.type === "SUBWAY") return <SubwaySegment card={card} />;
  return null;
}

function WalkSegment({ card }: { card: BackendNavigationCard }) {
  const dist = card.distance ?? 0;
  const min = Math.max(1, Math.round((card.duration ?? 0) / 60));
  return (
    <View style={styles.segmentRow}>
      <View style={styles.connector}>
        <View style={[styles.line, styles.lineWalk]} />
      </View>
      <View style={[styles.segmentCard, styles.walkCard]}>
        <View style={styles.segmentHeader}>
          <Text style={styles.segmentIcon}>🚶</Text>
          <Text style={styles.segmentTitle}>도보</Text>
        </View>
        <Text style={styles.segmentDetail}>
          {dist}m · 약 {min}분
        </Text>
      </View>
    </View>
  );
}

function BusSegment({ card }: { card: BackendNavigationCard }) {
  const min = Math.max(1, Math.round((card.duration ?? 0) / 60));
  return (
    <View style={styles.segmentRow}>
      <View style={styles.connector}>
        <View style={[styles.line, styles.lineBus]} />
      </View>
      <View style={[styles.segmentCard, styles.busCard]}>
        <View style={styles.segmentHeader}>
          <Text style={styles.segmentIcon}>🚌</Text>
          <View style={{ flex: 1 }}>
            <View style={styles.busNumberRow}>
              <Text style={styles.busNumber}>{card.busNumber ?? "-"}번</Text>
              {card.busType && (
                <Text style={styles.busType}>{card.busType}</Text>
              )}
            </View>
            <Text style={styles.segmentTitle}>버스 탑승</Text>
          </View>
        </View>
        {(card.boardingStop || card.alightingStop) && (
          <View style={styles.stopInfo}>
            {card.boardingStop && (
              <Text style={styles.stopText}>
                <Text style={styles.stopLabel}>승차 </Text>
                {card.boardingStop}
              </Text>
            )}
            {card.alightingStop && (
              <Text style={styles.stopText}>
                <Text style={styles.stopLabel}>하차 </Text>
                {card.alightingStop}
              </Text>
            )}
          </View>
        )}
        <Text style={styles.segmentDetail}>
          {card.stationsCount ? `${card.stationsCount}정거장 · ` : ""}약 {min}분
        </Text>
      </View>
    </View>
  );
}

function SubwaySegment({ card }: { card: BackendNavigationCard }) {
  const min = Math.max(1, Math.round((card.duration ?? 0) / 60));
  return (
    <View style={styles.segmentRow}>
      <View style={styles.connector}>
        <View style={[styles.line, styles.lineSubway]} />
      </View>
      <View style={[styles.segmentCard, styles.subwayCard]}>
        <View style={styles.segmentHeader}>
          <Text style={styles.segmentIcon}>🚇</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.subwayLine}>
              {card.lineNumber ? `${card.lineNumber}호선` : "지하철"}
            </Text>
            <Text style={styles.segmentTitle}>지하철 탑승</Text>
          </View>
        </View>
        {(card.boardingStop || card.alightingStop) && (
          <View style={styles.stopInfo}>
            {card.boardingStop && (
              <Text style={styles.stopText}>
                <Text style={styles.stopLabel}>승차 </Text>
                {card.boardingStop}
              </Text>
            )}
            {card.alightingStop && (
              <Text style={styles.stopText}>
                <Text style={styles.stopLabel}>하차 </Text>
                {card.alightingStop}
              </Text>
            )}
          </View>
        )}
        <Text style={styles.segmentDetail}>
          {card.stationsCount ? `${card.stationsCount}정거장 · ` : ""}약 {min}분
        </Text>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────
//  노드 (출발지 / 정류장 / 도착지)
// ──────────────────────────────────────────────

function RouteNode({
  type,
  label,
}: {
  type: "start" | "stop" | "end";
  label: string;
}) {
  const dot = (
    <View
      style={[
        styles.nodeDot,
        type === "start" && styles.nodeDotStart,
        type === "stop" && styles.nodeDotStop,
        type === "end" && styles.nodeDotEnd,
      ]}
    >
      <Text style={styles.nodeIcon}>
        {type === "start" ? "📍" : type === "end" ? "🏁" : "🚏"}
      </Text>
    </View>
  );

  return (
    <View style={styles.nodeRow}>
      {dot}
      <View style={styles.nodeLabelBox}>
        <Text style={styles.nodeLabel} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </View>
  );
}

// 정류장 노드 표시 여부:
// 현재가 BUS/SUBWAY이고 다음이 WALK이거나, 현재가 WALK이고 다음이 BUS/SUBWAY일 때 표시.
function shouldShowStopNode(
  current: BackendNavigationCard,
  next: BackendNavigationCard,
): boolean {
  const isTransit = (c: BackendNavigationCard) =>
    c.type === "BUS" || c.type === "SUBWAY";
  return (
    (isTransit(current) && next.type === "WALK") ||
    (current.type === "WALK" && isTransit(next))
  );
}

// 정류장 노드의 라벨:
// - BUS/SUBWAY 다음 → 그 카드의 alightingStop (하차 정류장)
// - WALK 다음 BUS/SUBWAY → 그 BUS/SUBWAY의 boardingStop (승차 정류장)
function getStopLabel(
  current: BackendNavigationCard,
  next: BackendNavigationCard,
): string {
  if (current.type === "BUS" || current.type === "SUBWAY") {
    return current.alightingStop ?? "정류장";
  }
  return next.boardingStop ?? "정류장";
}

// ──────────────────────────────────────────────
//  스타일
// ──────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },

  // 상단 요약
  summaryCard: {
    backgroundColor: "#1976D2",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#BBDEFB",
    fontWeight: "500",
  },
  summaryTime: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 4,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#BBDEFB",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  // 카드 리스트
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // 노드 (출발/정류장/도착)
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  nodeDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  nodeDotStart: {
    backgroundColor: "#4CAF50",
  },
  nodeDotStop: {
    backgroundColor: "#FFA726",
  },
  nodeDotEnd: {
    backgroundColor: "#1565C0",
  },
  nodeIcon: {
    fontSize: 20,
  },
  nodeLabelBox: {
    flex: 1,
  },
  nodeLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#212121",
  },

  // 세그먼트 (이동 수단)
  segmentRow: {
    flexDirection: "row",
    minHeight: 80,
  },
  connector: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    width: 4,
    flex: 1,
    borderRadius: 2,
  },
  lineWalk: {
    backgroundColor: "#9E9E9E",
  },
  lineBus: {
    backgroundColor: "#43A047",
  },
  lineSubway: {
    backgroundColor: "#E64A19",
  },
  segmentCard: {
    flex: 1,
    marginVertical: 6,
    marginLeft: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  walkCard: {
    borderLeftColor: "#9E9E9E",
  },
  busCard: {
    borderLeftColor: "#43A047",
    backgroundColor: "#E8F5E9",
  },
  subwayCard: {
    borderLeftColor: "#E64A19",
    backgroundColor: "#FBE9E7",
  },
  segmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  segmentIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  segmentTitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  segmentDetail: {
    fontSize: 14,
    color: "#424242",
    marginTop: 4,
  },

  // 버스 디테일
  busNumberRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  busNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    marginRight: 8,
  },
  busType: {
    fontSize: 13,
    color: "#558B2F",
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // 지하철 디테일
  subwayLine: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#BF360C",
  },

  // 정류장 정보
  stopInfo: {
    marginTop: 8,
    marginBottom: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  stopText: {
    fontSize: 15,
    color: "#212121",
    marginVertical: 2,
  },
  stopLabel: {
    fontWeight: "bold",
    color: "#666",
  },

  // 하단 닫기 버튼
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  closeBtn: {
    backgroundColor: "#1976D2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
