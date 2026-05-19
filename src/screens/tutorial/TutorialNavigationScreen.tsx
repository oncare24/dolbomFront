// [튜토리얼] 길안내 mock.
// mode === "walking": 도보 안내 카드
// mode === "transit": 버스 + 도보 카드 (요약 + 카드 리스트)
//
// 실제 NavigationScreen/TransitGuideScreen은 지도/GPS/실시간 API 사용.
// 튜토리얼에서는 단순화 — 안내 카드 리스트만.

import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { TutorialHintBubble } from "../../components/tutorial/TutorialHintBubble";
import { Colors, Radius, Spacing, Touch } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";
import {
  TUTORIAL_HINTS,
  TUTORIAL_TRANSIT_RESULT,
} from "../../constants/tutorialMocks";

type Nav = NativeStackNavigationProp<RootStackParamList, "TutorialNavigation">;
type RouteParams = RouteProp<RootStackParamList, "TutorialNavigation">;

// mock 도보 안내 — 4단계
const WALKING_STEPS = [
  { icon: "play-circle" as const, label: "출발", desc: "지금 계신 곳에서 출발해요" },
  { icon: "arrow-up" as const, label: "직진", desc: "약 250m 직진해 주세요" },
  { icon: "arrow-back" as const, label: "좌회전", desc: "큰 사거리에서 왼쪽으로" },
  { icon: "flag" as const, label: "도착", desc: "병원에 도착했어요" },
];

export default function TutorialNavigationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteParams>();
  const { mode, endName } = route.params;

  const handleComplete = () => {
    navigation.navigate("TutorialComplete");
  };

  const isTransit = mode === "transit";
  const hintText = isTransit
    ? TUTORIAL_HINTS.navigation_transit
    : TUTORIAL_HINTS.navigation_walking;

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />

      <View style={{ paddingTop: insets.top }}>
        <AppHeader
          title={isTransit ? "대중교통 안내" : "길안내"}
          audience="elderly"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 도착지 카드 (공통) */}
        <View style={styles.destinationCard}>
          <AppText
            variant="caption"
            audience="elderly"
            color="secondary"
            style={styles.destinationLabel}
          >
            도착지
          </AppText>
          <AppText
            variant="h2"
            audience="elderly"
            color="primary"
            style={styles.destinationName}
          >
            {endName ?? "병원"}
          </AppText>
          <AppText
            variant="body"
            audience="elderly"
            color="secondary"
          >
            {isTransit
              ? `🚌 약 ${Math.round(TUTORIAL_TRANSIT_RESULT.totalTime / 60)}분 · ${TUTORIAL_TRANSIT_RESULT.totalFare}원`
              : "🚶 도보 약 8분 (550m)"}
          </AppText>
        </View>

        {isTransit ? <TransitContent /> : <WalkingContent />}

        <TouchableOpacity
          onPress={handleComplete}
          style={styles.completeBtn}
          activeOpacity={0.85}
        >
          <AppText
            variant="bodyBold"
            audience="elderly"
            style={styles.completeBtnText}
          >
            완료
          </AppText>
        </TouchableOpacity>

        <View style={{ height: 180 }} />
      </ScrollView>

      <TutorialHintBubble text={hintText} />
    </View>
  );
}

// ─── 도보 안내 본문 ───
function WalkingContent() {
  return (
    <>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={48} color={Colors.gray?.[400] ?? "#A0A0A0"} />
        <AppText
          variant="caption"
          audience="elderly"
          color="secondary"
          style={styles.mapLabel}
        >
          (실제 사용 시 이곳에 지도가 표시돼요)
        </AppText>
      </View>

      <View style={styles.stepsContainer}>
        {WALKING_STEPS.map((step, idx) => (
          <View key={idx} style={styles.stepCard}>
            <View style={styles.stepIcon}>
              <Ionicons
                name={step.icon}
                size={28}
                color={Colors.brand.primary}
              />
            </View>
            <View style={styles.stepText}>
              <AppText variant="bodyBold" audience="elderly" color="primary">
                {step.label}
              </AppText>
              <AppText variant="body" audience="elderly" color="secondary">
                {step.desc}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

// ─── 대중교통 안내 본문 ───
function TransitContent() {
  return (
    <View style={styles.stepsContainer}>
      {TUTORIAL_TRANSIT_RESULT.cards.map((card, idx) => {
        const isBus = card.type === "BUS";
        const iconName = isBus ? "bus" : "walk";
        const iconColor = isBus ? "#F59E0B" : Colors.brand.primary;

        return (
          <View
            key={idx}
            style={[styles.stepCard, isBus && styles.stepCardBus]}
          >
            <View
              style={[
                styles.stepIcon,
                isBus && { backgroundColor: "#FEF3C7" },
              ]}
            >
              <Ionicons name={iconName} size={28} color={iconColor} />
            </View>
            <View style={styles.stepText}>
              {isBus ? (
                <>
                  <AppText
                    variant="bodyBold"
                    audience="elderly"
                    color="primary"
                  >
                    {card.busNumber}번 버스
                  </AppText>
                  <AppText
                    variant="body"
                    audience="elderly"
                    color="secondary"
                  >
                    {card.startStopName} → {card.endStopName}
                  </AppText>
                  <AppText
                    variant="caption"
                    audience="elderly"
                    color="secondary"
                  >
                    {card.passStopCount}정거장 ·{" "}
                    {Math.round(card.duration / 60)}분
                  </AppText>
                </>
              ) : (
                <>
                  <AppText
                    variant="bodyBold"
                    audience="elderly"
                    color="primary"
                  >
                    도보 이동
                  </AppText>
                  <AppText
                    variant="body"
                    audience="elderly"
                    color="secondary"
                  >
                    {card.description} · 약 {card.distance}m
                  </AppText>
                  <AppText
                    variant="caption"
                    audience="elderly"
                    color="secondary"
                  >
                    약 {Math.round(card.duration / 60)}분
                  </AppText>
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  destinationCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  destinationLabel: {
    marginBottom: Spacing.xs,
  },
  destinationName: {
    marginBottom: Spacing.sm,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: Colors.gray?.[100] ?? "#F3F4F6",
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  mapLabel: {
    textAlign: "center",
  },
  stepsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  stepCardBus: {
    backgroundColor: "#FFFBEB",
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    flex: 1,
    gap: 4,
  },
  completeBtn: {
    minHeight: Touch.senior,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  completeBtnText: {
    color: Colors.text.inverse,
  },
});
