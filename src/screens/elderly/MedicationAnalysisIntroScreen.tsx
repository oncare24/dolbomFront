import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { PrimaryButton } from "../../components/common/Button";
import { BottomActionBar } from "../../components/common/BottomActionBar";
import { Colors, Radius, Spacing } from "../../theme";
import { useDrugSafetyAuthStore } from "../../stores/drugSafetyAuthStore";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<
  RootStackParamList,
  "MedicationAnalysisIntro"
>;

interface BulletProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
}

function Bullet({ icon, title, body }: BulletProps) {
  return (
    <View style={styles.bullet}>
      <View style={styles.bulletIconWrap}>
        <Ionicons name={icon} size={24} color={Colors.brand.primary} />
      </View>
      <View style={styles.bulletText}>
        <AppText variant="bodyBold" audience="elderly">
          {title}
        </AppText>
        <AppText
          variant="body"
          audience="elderly"
          color="secondary"
          style={styles.bulletBody}
        >
          {body}
        </AppText>
      </View>
    </View>
  );
}

export default function MedicationAnalysisIntroScreen() {
  const navigation = useNavigation<Nav>();
  const reset = useDrugSafetyAuthStore((s) => s.reset);

  // 진입 시 이전 흐름 잔여 데이터 초기화.
  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <View style={styles.root}>
      <AppHeader title="처방전 안전 분석" audience="elderly" />

      <ScreenContainer audience="elderly" scrollable paddingTop={Spacing.md}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="medkit" size={56} color={Colors.brand.primary} />
          </View>
          <AppText variant="h1" audience="elderly" style={styles.heroTitle}>
            복용 중인 약,{"\n"}안전한지 확인해 드려요
          </AppText>
          <AppText
            variant="body"
            audience="elderly"
            color="secondary"
            style={styles.heroSub}
          >
            병원에서 받은 처방전을 바탕으로 위험한 약물 조합이 있는지 살펴봐
            드립니다.
          </AppText>
        </View>

        <View style={styles.bullets}>
          <Bullet
            icon="finger-print"
            title="본인 인증"
            body="카카오톡으로 안전하게 본인을 확인합니다."
          />
          <Bullet
            icon="document-text"
            title="처방전 자동 조회"
            body="건강보험공단에서 최근 처방 정보를 불러옵니다."
          />
          <Bullet
            icon="shield-checkmark"
            title="안전 분석"
            body="함께 먹으면 위험한 약, 어르신 주의 약 등을 알려드립니다."
          />
        </View>

        <View style={styles.notice}>
          <Ionicons
            name="lock-closed"
            size={20}
            color={Colors.text.secondary}
          />
          <AppText
            variant="caption"
            audience="elderly"
            color="secondary"
            style={styles.noticeText}
          >
            주민등록번호는 처방전 조회에만 사용되고 저장되지 않습니다.
          </AppText>
        </View>
      </ScreenContainer>

      <BottomActionBar audience="elderly">
        <PrimaryButton
          label="시작하기"
          audience="elderly"
          onPress={() => navigation.navigate("MedicationAnalysisForm")}
        />
      </BottomActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  hero: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  heroTitle: {
    textAlign: "center",
  },
  heroSub: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  bullets: {
    gap: Spacing.md,
  },
  bullet: {
    flexDirection: "row",
    backgroundColor: Colors.surface.card,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    gap: Spacing.md,
    alignItems: "center",
  },
  bulletIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  bulletText: {
    flex: 1,
  },
  bulletBody: {
    marginTop: 4,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray[100],
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  noticeText: {
    flex: 1,
  },
});
