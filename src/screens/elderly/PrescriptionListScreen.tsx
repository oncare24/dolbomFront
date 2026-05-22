// 처방받은 약 목록 화면.
// 분석 결과 화면에서 PrescriptionEntryCard 탭으로 진입.
// useSelfMedicationAnalysis 재호출 → react-query 캐시 활용(네트워크 0번).
// groupPrescriptions로 동일 약 + 동일 복용법 자동 합침.

import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { BottomActionBar } from "../../components/common/BottomActionBar";
import { PrimaryButton } from "../../components/common/Button";
import { PrescriptionCardElderly } from "../../components/elderly/PrescriptionCardElderly";

import { Colors, Spacing } from "../../theme";
import { useSelfMedicationAnalysis } from "../../hooks/useDrugSafety";
import { groupPrescriptions } from "../../utils/prescription";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "PrescriptionList">;

export default function PrescriptionListScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading } = useSelfMedicationAnalysis();

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
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

  // ─── 빈 (안전 가드, 정상 흐름에서는 거의 없음) ───
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
      <ScreenContainer audience="elderly" scrollable paddingTop={Spacing.md}>
        <AppText
          variant="caption"
          audience="elderly"
          color="secondary"
          style={styles.subtitle}
        >
          총 {groups.length}종
        </AppText>
        <View style={styles.list}>
          {groups.map((g, i) => (
            <PrescriptionCardElderly key={i} group={g} />
          ))}
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
});
