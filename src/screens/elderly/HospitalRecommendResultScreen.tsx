// 병원 추천 결과 화면.
//
// 흐름:
//   MedicalChatScreen (done=true) → navigation.navigate("HospitalRecommendResult", { result })
//   → 이 화면에서 진료과 + 신뢰도 + 차순위 + 병원 카드 리스트 표시
//   → 길안내 버튼 → NavigationModeModal (도보/대중교통 선택)
//   → 선택 → HospitalNavigation 화면으로 이동

import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { AppHeader } from "../../components/common/Header";
import { Colors, Spacing } from "../../theme";
import NavigationModeModal from "../../components/elderly/NavigationModeModal";
import type { RootStackParamList } from "../../types/navigation";
import type { ScoredHospital, RecommendResponse } from "../../types/hospital";
import { FloatingSosButton } from "../../components/elderly/FloatingSosButton";
type ResultRouteProp = RouteProp<RootStackParamList, "HospitalRecommendResult">;
type Nav = NativeStackNavigationProp<
  RootStackParamList,
  "HospitalRecommendResult"
>;

export default function HospitalRecommendResultScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<ResultRouteProp>();
  const navigation = useNavigation<Nav>();

  const result: RecommendResponse = route.params.result;

  const [selectedHospital, setSelectedHospital] =
    useState<ScoredHospital | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleNavigate = (hospital: ScoredHospital) => {
    setSelectedHospital(hospital);
    setModalVisible(true);
  };

  const handleSelectMode = (mode: "walking" | "transit") => {
    if (!selectedHospital) return;
    setModalVisible(false);

    navigation.navigate("HospitalNavigation", {
      mode,
      endLat: selectedHospital.latitude,
      endLon: selectedHospital.longitude,
      endName: selectedHospital.name,
      startLat: result.userLatitude,
      startLon: result.userLongitude,
    });
  };

  // 신뢰도를 % 형태로 변환 (예: 0.92 → 92)
  const confidencePct = Math.round(result.confidence * 100);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />

      <View style={{ paddingTop: insets.top }}>
        <AppHeader title="추천 병원" audience="elderly" />
      </View>

      {/* 진료과 + LLM 분석 정보 */}
      <View style={styles.summary}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryDept}>{result.department}</Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              분석 정확도 {confidencePct}%
            </Text>
          </View>
        </View>

        {result.secondaryDepartment && (
          <Text style={styles.secondaryDept}>
            또는: {result.secondaryDepartment}
          </Text>
        )}

        <Text style={styles.summaryReason}>{result.reason}</Text>
      </View>

      <FlatList
        data={result.hospitals}
        keyExtractor={(item, idx) => `${item.name}-${idx}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <HospitalCard
            hospital={item}
            onNavigate={() => handleNavigate(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              검색 반경 내 병원이 없어요. 잠시 후 다시 시도해주세요.
            </Text>
          </View>
        }
      />

      <NavigationModeModal
        visible={modalVisible}
        hospitalName={selectedHospital?.name ?? ""}
        onSelect={handleSelectMode}
        onClose={() => setModalVisible(false)}
      />
      <FloatingSosButton />
    </View>
  );
}

// ── 병원 카드 컴포넌트 ──

interface HospitalCardProps {
  hospital: ScoredHospital;
  onNavigate: () => void;
}

function HospitalCard({ hospital, onNavigate }: HospitalCardProps) {
  const km = (hospital.distanceMeters / 1000).toFixed(1);
  const openLabel =
    hospital.isOpenNow === true
      ? "영업 중"
      : hospital.isOpenNow === false
      ? "영업 종료"
      : "영업 정보 없음";
  const openColor =
    hospital.isOpenNow === true
      ? "#3CB371"
      : hospital.isOpenNow === false
      ? "#A0A0A0"
      : "#A0A0A0";

  return (
    <View style={styles.card}>
      <Text style={styles.cardName} numberOfLines={1}>
        {hospital.name}
      </Text>

      <Text style={styles.cardAddress} numberOfLines={2}>
        📍 {hospital.address}
      </Text>

      <View style={styles.cardMeta}>
        <Text style={styles.cardDistance}>🚶 {km}km</Text>
        <Text style={[styles.cardOpen, { color: openColor }]}>{openLabel}</Text>
      </View>

      <Text style={styles.cardTel}>📞 {hospital.tel || "전화 정보 없음"}</Text>

      <TouchableOpacity style={styles.navigateBtn} onPress={onNavigate}>
        <Text style={styles.navigateBtnText}>길안내</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  summary: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  summaryDept: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1976D2",
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: "#1565C0",
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryDept: {
    fontSize: 14,
    color: "#1976D2",
    marginBottom: 4,
    fontWeight: "500",
  },
  summaryReason: {
    fontSize: 16,
    color: "#444",
    lineHeight: 22,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },
  cardAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 6,
  },
  cardDistance: {
    fontSize: 15,
    color: "#444",
    fontWeight: "600",
  },
  cardOpen: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardTel: {
    fontSize: 14,
    color: "#666",
    marginBottom: Spacing.md,
  },
  navigateBtn: {
    backgroundColor: "#1976D2",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  navigateBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  empty: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
});
