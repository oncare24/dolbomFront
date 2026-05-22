// 병원 추천 결과 화면.
//
// 흐름:
//   MedicalChatScreen (done=true) → navigation.navigate("HospitalRecommendResult", { result })
//   → 이 화면에서 진료과 + 신뢰도 + 차순위 + 병원 카드 리스트 표시
//   → 카드의 [전화 걸기]: 시스템 다이얼러 호출 (Linking.openURL("tel:..."))
//   → 카드의 [길안내]: NavigationModeModal → HospitalNavigation 화면으로 이동

import React, { useState } from "react";
import {
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

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

  // 신뢰도를 % 형태로 변환
  const confidencePct = Math.round(result.confidence * 100);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />

      <AppHeader title="추천 병원" audience="elderly" />

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

  // 전화번호 유효성 확인 — 없거나 빈 문자열이면 버튼 비활성화
  const hasTel = !!hospital.tel && hospital.tel.trim().length > 0;

  const handleCall = async () => {
    if (!hasTel) return;
    // 숫자, +, # 만 남김 (다이얼러가 안전하게 인식하도록)
    const cleaned = hospital.tel!.replace(/[^0-9+#]/g, "");
    const url = `tel:${cleaned}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("전화 걸기 실패", "전화 앱을 열 수 없어요.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("전화 걸기 실패", "잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardName} numberOfLines={2}>
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

      {/* 전화 걸기 버튼 — 노인 친화: 큰 글씨, 초록색 (전화 앱과 통일감) */}
      <TouchableOpacity
        style={[styles.callBtn, !hasTel && styles.callBtnDisabled]}
        onPress={handleCall}
        disabled={!hasTel}
        activeOpacity={0.85}
      >
        <Ionicons name="call" size={24} color="#fff" />
        <Text style={styles.callBtnText}>전화 걸기</Text>
      </TouchableOpacity>

      {/* 길안내 버튼 */}
      <TouchableOpacity
        style={styles.navigateBtn}
        onPress={onNavigate}
        activeOpacity={0.85}
      >
        <Ionicons name="navigate" size={24} color="#fff" />
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
    marginBottom: 6,
  },
  // ── 글씨 크기 노인 친화 키움 ──
  summaryDept: {
    fontSize: 30, // 24 → 30
    fontWeight: "700",
    color: "#1976D2",
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  confidenceText: {
    color: "#1565C0",
    fontSize: 15, // 13 → 15
    fontWeight: "600",
  },
  secondaryDept: {
    fontSize: 18, // 14 → 18
    color: "#1976D2",
    marginBottom: 6,
    fontWeight: "500",
  },
  summaryReason: {
    fontSize: 20, // 16 → 20
    color: "#444",
    lineHeight: 28,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl, // 하단 여백 더 확보 (SOS 버튼 가리지 않게)
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: Spacing.lg, // padding 키움
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardName: {
    fontSize: 24, // 18 → 24
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
    lineHeight: 32,
  },
  cardAddress: {
    fontSize: 18, // 14 → 18
    color: "#444",
    marginBottom: 10,
    lineHeight: 26,
  },
  cardMeta: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 8,
    alignItems: "center",
  },
  cardDistance: {
    fontSize: 19, // 15 → 19
    color: "#444",
    fontWeight: "600",
  },
  cardOpen: {
    fontSize: 18, // 14 → 18
    fontWeight: "600",
  },
  cardTel: {
    fontSize: 20, // 14 → 20 (전화번호 잘 보이게)
    color: "#444",
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  // ── 전화 걸기 버튼 (초록) ──
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#10B981", // 전화 앱 친화적 초록
    paddingVertical: 16, // 12 → 16 (노인 친화)
    borderRadius: 10,
    marginBottom: 10,
  },
  callBtnDisabled: {
    backgroundColor: "#9CA3AF", // 회색
  },
  callBtnText: {
    color: "#fff",
    fontSize: 22, // 큰 글씨
    fontWeight: "700",
  },
  // ── 길안내 버튼 (파랑) ──
  navigateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#1976D2",
    paddingVertical: 16,
    borderRadius: 10,
  },
  navigateBtnText: {
    color: "#fff",
    fontSize: 22, // 17 → 22
    fontWeight: "700",
  },
  empty: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 20, // 16 → 20
    color: "#666",
    textAlign: "center",
    lineHeight: 28,
  },
});
