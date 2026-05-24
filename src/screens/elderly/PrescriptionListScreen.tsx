// 처방받은 약 목록 화면.
// 분석 결과 화면에서 진입. 경고의 "약 이름" 탭으로 들어오면
// highlightDrugName로 해당 약 카드로 스크롤 + 잠깐 강조.

import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { BottomActionBar } from "../../components/common/BottomActionBar";
import { PrimaryButton } from "../../components/common/Button";
import { PrescriptionCardElderly } from "../../components/elderly/PrescriptionCardElderly";

import { Colors, Radius, Spacing } from "../../theme";
import { useSelfMedicationAnalysis } from "../../hooks/useDrugSafety";
import { cleanField, groupPrescriptions } from "../../utils/prescription";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "PrescriptionList">;
type Route = RouteProp<RootStackParamList, "PrescriptionList">;

export default function PrescriptionListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const highlightName = route.params?.highlightDrugName
    ? cleanField(route.params.highlightDrugName)
    : null;

  const { data, isLoading } = useSelfMedicationAnalysis();

  const scrollRef = useRef<ScrollView>(null);
  const listYRef = useRef(0);
  const didScrollRef = useRef(false);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightName) return;
    setHighlightedKey(highlightName);
    const t = setTimeout(() => setHighlightedKey(null), 2500);
    return () => clearTimeout(t);
  }, [highlightName]);

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const scrollToTarget = (cardY: number) => {
    if (didScrollRef.current) return;
    didScrollRef.current = true;
    const y = Math.max(0, listYRef.current + cardY - 12);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y, animated: true }),
    );
  };

  // ─── 로딩 ───
  if (isLoading) {
    return (
      <View style={styles.root}>
        <AppHeader
          title="처방받은 약"
          audience="elderly"
          onBackPress={goBack}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
        </View>
      </View>
    );
  }

  const groups = groupPrescriptions(data?.prescriptions ?? []);

  // ─── 빈 ───
  if (groups.length === 0) {
    return (
      <View style={styles.root}>
        <AppHeader
          title="처방받은 약"
          audience="elderly"
          onBackPress={goBack}
        />
        <View style={styles.centered}>
          <AppText variant="body" audience="elderly" color="secondary">
            처방받은 약이 없어요
          </AppText>
        </View>
        <BottomActionBar audience="elderly">
          <PrimaryButton label="확인" audience="elderly" onPress={goBack} />
        </BottomActionBar>
      </View>
    );
  }

  // ─── 정상 ───
  return (
    <View style={styles.root}>
      <AppHeader title="처방받은 약" audience="elderly" onBackPress={goBack} />
      <ScreenContainer
        ref={scrollRef}
        audience="elderly"
        scrollable
        paddingTop={Spacing.md}
      >
        <AppText
          variant="caption"
          audience="elderly"
          color="secondary"
          style={styles.subtitle}
        >
          총 {groups.length}종
        </AppText>
        <View
          style={styles.list}
          onLayout={(e) => {
            listYRef.current = e.nativeEvent.layout.y;
          }}
        >
          {groups.map((g, i) => {
            const key = cleanField(g.prescription.resDrugName);
            const isTarget = highlightName != null && key === highlightName;
            return (
              <View
                key={i}
                onLayout={
                  isTarget
                    ? (e) => scrollToTarget(e.nativeEvent.layout.y)
                    : undefined
                }
                style={highlightedKey === key ? styles.highlight : undefined}
              >
                <PrescriptionCardElderly group={g} />
              </View>
            );
          })}
        </View>
      </ScreenContainer>
      <BottomActionBar audience="elderly">
        <PrimaryButton label="확인" audience="elderly" onPress={goBack} />
      </BottomActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  list: {
    gap: Spacing.md,
  },
  highlight: {
    borderWidth: 2,
    borderColor: Colors.semantic.info,
    borderRadius: Radius.xl,
  },
});
