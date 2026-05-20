// [튜토리얼] 병원 추천 결과 mock.
// 실제 HospitalRecommendResultScreen과 동일한 UI/사이즈.
// 차이점:
//   - 전화 걸기 → 실제 다이얼러 X, 안내 토스트로 시연
//   - 길안내 → 모달 → 도보/대중교통 선택 → TutorialNavigation

import React, { useState } from "react";
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader } from "../../components/common/Header";
import { useToast } from "../../components/common/Toast";
import { Colors, Spacing } from "../../theme";
import NavigationModeModal from "../../components/elderly/NavigationModeModal";
import { TutorialHintBubble } from "../../components/tutorial/TutorialHintBubble";
import type { RootStackParamList } from "../../types/navigation";
import type { ScoredHospital } from "../../types/hospital";
import { TUTORIAL_HINTS } from "../../constants/tutorialMocks";

type ResultRouteProp = RouteProp<RootStackParamList, "TutorialHospitalResult">;
type Nav = NativeStackNavigationProp<
  RootStackParamList,
  "TutorialHospitalResult"
>;

export default function TutorialHospitalResultScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<ResultRouteProp>();
  const navigation = useNavigation<Nav>();
  const toast = useToast();

  const result = route.params.result;

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
    navigation.navigate("TutorialNavigation", {
      mode,
      endLat: selectedHospital.latitude,
      endLon: selectedHospital.longitude,
      endName: selectedHospital.name,
      startLat: result.userLatitude,
      startLon: result.userLongitude,
    });
  };

  // 튜토리얼: 실제 전화 X — 안내 토스트만
  const handleTutorialCall = () => {
    toast.show({
      message: "실제로 사용하시면 전화 앱이 열려요.",
      variant: "info",
    });
  };

  const confidencePct = Math.round(result.confidence * 100);
  const hintText = modalVisible ? TUTORIAL_HINTS.modal : TUTORIAL_HINTS.result;

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />

      <View style={{ paddingTop: insets.top }}>
        <AppHeader title="추천 병원" audience="elderly" />
      </View>

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
            onCall={handleTutorialCall}
            onNavigate={() => handleNavigate(item)}
          />
        )}
      />

      <NavigationModeModal
        visible={modalVisible}
        hospitalName={selectedHospital?.name ?? ""}
        onSelect={handleSelectMode}
        onClose={() => setModalVisible(false)}
      />

      <TutorialHintBubble text={hintText} />
    </View>
  );
}

interface HospitalCardProps {
  hospital: ScoredHospital;
  onCall: () => void;
  onNavigate: () => void;
}

function HospitalCard({ hospital, onCall, onNavigate }: HospitalCardProps) {
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

      <TouchableOpacity
        style={styles.callBtn}
        onPress={onCall}
        activeOpacity={0.85}
      >
        <Ionicons name="call" size={24} color="#fff" />
        <Text style={styles.callBtnText}>전화 걸기</Text>
      </TouchableOpacity>

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
  summaryDept: {
    fontSize: 30,
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
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryDept: {
    fontSize: 18,
    color: "#1976D2",
    marginBottom: 6,
    fontWeight: "500",
  },
  summaryReason: {
    fontSize: 20,
    color: "#444",
    lineHeight: 28,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 220, // HintBubble + 여백
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
    lineHeight: 32,
  },
  cardAddress: {
    fontSize: 18,
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
    fontSize: 19,
    color: "#444",
    fontWeight: "600",
  },
  cardOpen: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardTel: {
    fontSize: 20,
    color: "#444",
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  callBtnText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
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
    fontSize: 22,
    fontWeight: "700",
  },
});
