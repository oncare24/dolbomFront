import React, { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { PrimaryButton, SecondaryButton } from "../../components/common/Button";
import { BottomActionBar } from "../../components/common/BottomActionBar";
import { useToast } from "../../components/common/Toast";
import { Colors, Radius, Spacing } from "../../theme";
import { useDrugSafetyAuthStore } from "../../stores/drugSafetyAuthStore";
import { ApiException } from "../../services/api";
import type { RootStackParamList } from "../../types/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { drugSafetyKeys, useConfirmCodefAuth } from "../../hooks/useDrugSafety";
import { getMedicationAnalysis } from "../../services/drugSafetyService";
type Nav = NativeStackNavigationProp<
  RootStackParamList,
  "MedicationAnalysisWaiting"
>;

// 카카오톡 간편인증 통상 만료 시간(분).
const EXPIRY_MINUTES = 3;

export default function MedicationAnalysisWaitingScreen() {
  const navigation = useNavigation<Nav>();
  const toast = useToast();
  const authInput = useDrugSafetyAuthStore((s) => s.authInput);
  const session = useDrugSafetyAuthStore((s) => s.session);
  const reset = useDrugSafetyAuthStore((s) => s.reset);
  const { mutateAsync, isPending } = useConfirmCodefAuth();
  const qc = useQueryClient(); // ← 추가

  const startedAtRef = useRef(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 경과 시간 표시 (만료 안내용).
  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // 세션 없으면(딥링크/뒤로가기 등 직접 진입) 처음으로 되돌리기.
  useEffect(() => {
    if (!authInput || !session) {
      navigation.reset({
        index: 1,
        routes: [{ name: "ElderlyHome" }, { name: "MedicationAnalysisIntro" }],
      });
    }
  }, [authInput, session, navigation]);

  const handleConfirm = useCallback(async () => {
    if (!authInput || !session) return;
    try {
      await mutateAsync({
        ...authInput,
        jti: session.jti,
        twoWayTimestamp: session.twoWayTimestamp,
      });
      navigation.reset({
        index: 1,
        routes: [{ name: "ElderlyHome" }, { name: "MedicationAnalysisResult" }],
      });
      reset(); // 결과 화면 진입 직후 잔여 민감정보 제거.
    } catch (e) {
      // ─── Phantom timeout 안전망 ───
      // 클라이언트 timeout/네트워크 오류여도 백엔드는 성공했을 수 있다.
      // GET /analysis 로 결과 존재 여부 확인 → 있으면 정상 흐름 진입.
      try {
        const cached = await getMedicationAnalysis();
        if (cached?.warnings) {
          qc.setQueryData(drugSafetyKeys.selfAnalysis(), cached);
          navigation.reset({
            index: 1,
            routes: [
              { name: "ElderlyHome" },
              { name: "MedicationAnalysisResult" },
            ],
          });
          reset();
          return;
        }
      } catch {
        // 캐시도 없음 → 원래 에러 처리로 폴백.
      }
      if (!(e instanceof ApiException)) {
        toast.show({ message: "처방전 조회에 실패했어요", variant: "error" });
      }
    }
  }, [authInput, session, mutateAsync, navigation, reset, toast, qc]);

  const handleOpenKakao = useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL("kakaotalk://");
      if (supported) {
        await Linking.openURL("kakaotalk://");
      } else {
        toast.show({
          message: "카카오톡이 설치되어 있지 않아요",
          variant: "error",
        });
      }
    } catch {
      toast.show({
        message: "카카오톡을 열 수 없어요",
        variant: "error",
      });
    }
  }, [toast]);

  const handleCancel = useCallback(() => {
    reset();
    navigation.goBack();
  }, [reset, navigation]);

  const minutesRemaining = Math.max(
    0,
    EXPIRY_MINUTES - Math.floor(elapsedSeconds / 60),
  );
  const expired = minutesRemaining === 0;

  return (
    <View style={styles.root}>
      <AppHeader
        title="카카오톡 인증"
        audience="elderly"
        onBackPress={handleCancel}
      />

      <ScreenContainer audience="elderly" scrollable paddingTop={Spacing.lg}>
        <View style={styles.hero}>
          <View style={styles.kakaoIcon}>
            <Ionicons name="chatbubble" size={64} color="#3A1D1D" />
          </View>
          <AppText variant="h1" audience="elderly" style={styles.title}>
            카카오톡을{"\n"}확인해 주세요
          </AppText>
          <AppText
            variant="body"
            audience="elderly"
            color="secondary"
            style={styles.subtitle}
          >
            카카오톡으로 인증 메시지를 보냈어요.{"\n"}
            메시지를 열어 인증을 완료해 주세요.
          </AppText>

          <Pressable
            onPress={handleOpenKakao}
            style={({ pressed }) => [
              styles.openKakaoBtn,
              pressed && styles.openKakaoBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="카카오톡 열기"
          >
            <Ionicons name="open-outline" size={22} color="#3A1D1D" />
            <AppText
              variant="bodyBold"
              audience="elderly"
              style={styles.openKakaoText}
            >
              카카오톡 열기
            </AppText>
          </Pressable>
        </View>

        <View style={styles.steps}>
          {[
            "카카오톡을 열어 주세요",
            "인증 알림에서 “인증하기”를 눌러 주세요",
            "완료되면 아래 “인증 완료” 버튼을 눌러 주세요",
          ].map((text, idx) => (
            <View key={idx} style={styles.step}>
              <View style={styles.stepNumber}>
                <AppText variant="bodyBold" audience="elderly" color="inverse">
                  {idx + 1}
                </AppText>
              </View>
              <AppText
                variant="body"
                audience="elderly"
                style={styles.stepText}
              >
                {text}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.expiry}>
          <Ionicons
            name="time-outline"
            size={20}
            color={expired ? Colors.semantic.warning : Colors.text.secondary}
          />
          <AppText
            variant="caption"
            audience="elderly"
            color={expired ? "danger" : "secondary"}
          >
            {expired
              ? "시간이 오래 지났어요. 처음부터 다시 시도해 주세요."
              : `약 ${minutesRemaining}분 안에 완료해 주세요`}
          </AppText>
        </View>
      </ScreenContainer>

      <BottomActionBar audience="elderly">
        <View style={styles.actions}>
          <View style={styles.cancelWrap}>
            <SecondaryButton
              label="취소"
              audience="elderly"
              onPress={handleCancel}
              disabled={isPending}
            />
          </View>
          <View style={styles.confirmWrap}>
            <PrimaryButton
              label="인증 완료"
              audience="elderly"
              loading={isPending}
              disabled={expired || isPending}
              onPress={handleConfirm}
            />
          </View>
        </View>
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
  kakaoIcon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#FEE500",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  openKakaoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: "#FEE500",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
  },
  openKakaoBtnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  openKakaoText: {
    color: "#3A1D1D",
  },
  steps: {
    gap: Spacing.md,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.card,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    flex: 1,
  },
  expiry: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  cancelWrap: {
    flex: 1,
  },
  confirmWrap: {
    flex: 1,
  },
});
