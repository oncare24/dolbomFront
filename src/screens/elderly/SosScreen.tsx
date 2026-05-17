// 피보호자 SOS 긴급 호출 화면.
//
// 흐름 (iPhone Emergency SOS / Life360 표준 패턴):
//   [counting] → 진입 즉시 5초 카운트다운 자동 시작.
//                "취소" 버튼만 액티브. 다른 액션 X.
//                → 5초 경과 시 자동 발송
//   [pending]  → 발송 진행 중 (FCM 발송)
//                → 성공 시 done, 실패 시 idle
//   [done]     → 결과 화면. notifiedGuardianCount 분기:
//                - >0: "보호자 N명에게 알렸어요" + 119 직접 전화 + 홈으로
//                - =0: "연결된 보호자가 없어요" + 119 강조
//   [idle]     → 실패 후 재시도 가능 ("다시 호출" 버튼)
//
// 시니어 UI 라이팅: 명사형/짧은 동사형. 친숙한 한자어만.
// 카운트다운 5초 = iPhone(3초) + Life360(10초) 사이 균형.

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/common/Layout";
import { AppText } from "../../components/common/Text";
import { useToast } from "../../components/common/Toast";
import { useSosTrigger } from "../../hooks/useSosTrigger";
import { haptic } from "../../utils/haptics";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import { ApiException } from "../../services/api";
import type { RootStackParamList } from "../../types/navigation";
import type { SosEvent } from "../../types/sos";

type Nav = NativeStackNavigationProp<RootStackParamList, "Sos">;

const COUNTDOWN_SECONDS = 5;

type ScreenState =
  | { kind: "counting"; remaining: number }
  | { kind: "pending" }
  | { kind: "done"; result: SosEvent }
  | { kind: "idle" };

export default function SosScreen() {
  const navigation = useNavigation<Nav>();
  const toast = useToast();
  const { mutateAsync, isPending } = useSosTrigger();

  const [state, setState] = useState<ScreenState>({
    kind: "counting",
    remaining: COUNTDOWN_SECONDS,
  });

  // 카운트다운 인터벌. setState로는 자기 자신 갱신 안전성 떨어져서 ref + state 분리.
  const cancelledRef = useRef(false);

  // ─── 발송 ─────────────────────────────────
  const send = useCallback(async () => {
    if (cancelledRef.current) return;
    setState({ kind: "pending" });
    try {
      const result = await mutateAsync();
      if (cancelledRef.current) return; // 발송 후 취소 — 일단 발송됐으니 결과는 노출
      haptic.success();
      setState({ kind: "done", result });
    } catch (err) {
      haptic.error();
      const msg =
        err instanceof ApiException ? err.message : "호출에 실패했어요";
      toast.show({ message: msg, variant: "error" });
      setState({ kind: "idle" });
    }
  }, [mutateAsync, toast]);

  // ─── 카운트다운 ───────────────────────────
  useEffect(() => {
    if (state.kind !== "counting") return;

    if (state.remaining <= 0) {
      send();
      return;
    }

    haptic.heavy(); // 매 초 진동 — "곧 호출" 인지

    const timer = setTimeout(() => {
      setState((prev) =>
        prev.kind === "counting"
          ? { kind: "counting", remaining: prev.remaining - 1 }
          : prev,
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [state, send]);

  // ─── 액션 ─────────────────────────────────
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    haptic.medium();
    navigation.goBack();
  }, [navigation]);

  const retry = useCallback(() => {
    cancelledRef.current = false;
    setState({ kind: "counting", remaining: COUNTDOWN_SECONDS });
  }, []);

  const callEmergency = useCallback(() => {
    Linking.openURL("tel:119").catch(() => {
      Alert.alert("연결 실패", "119 전화 앱을 열 수 없어요.");
    });
  }, []);

  const goHome = useCallback(() => {
    navigation.navigate("ElderlyHome");
  }, [navigation]);

  // ─── 렌더 ─────────────────────────────────
  return (
    <ScreenContainer audience="elderly">
      <View style={styles.body}>
        {state.kind === "counting" && (
          <CountingView remaining={state.remaining} onCancel={cancel} />
        )}

        {state.kind === "pending" && <PendingView />}

        {state.kind === "done" && (
          <DoneView
            result={state.result}
            onCallEmergency={callEmergency}
            onGoHome={goHome}
          />
        )}

        {state.kind === "idle" && (
          <IdleView disabled={isPending} onRetry={retry} onCancel={cancel} />
        )}
      </View>
    </ScreenContainer>
  );
}

// ──────────────────────────────────────────────────────────
// counting — 큰 카운트다운 숫자 + 큰 취소 버튼
// ──────────────────────────────────────────────────────────
function CountingView({
  remaining,
  onCancel,
}: {
  remaining: number;
  onCancel: () => void;
}) {
  return (
    <>
      <View style={styles.topSection}>
        <Ionicons name="warning" size={64} color={Colors.semantic.danger} />
        <AppText variant="h1" style={styles.headline}>
          긴급 호출
        </AppText>
        <AppText variant="body" color="secondary" style={styles.descBody}>
          {remaining}초 후 보호자에게{"\n"}자동으로 알림이 갑니다.
        </AppText>
      </View>

      <View style={styles.countdownWrap}>
        <View style={styles.countdownCircle}>
          <AppText
            variant="display"
            color="inverse"
            style={styles.countdownNumber}
          >
            {remaining}
          </AppText>
        </View>
      </View>

      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="긴급 호출 취소"
        style={({ pressed }) => [
          styles.bigCancelButton,
          pressed && styles.bigCancelButtonPressed,
        ]}
      >
        <AppText variant="h2" color="inverse" style={styles.bigCancelLabel}>
          취소
        </AppText>
      </Pressable>
    </>
  );
}

// ──────────────────────────────────────────────────────────
// pending — 발송 중
// ──────────────────────────────────────────────────────────
function PendingView() {
  return (
    <View style={styles.centerFill}>
      <ActivityIndicator size="large" color={Colors.semantic.danger} />
      <AppText variant="h3" style={styles.pendingText}>
        보호자에게 알리는 중…
      </AppText>
    </View>
  );
}

// ──────────────────────────────────────────────────────────
// idle — 실패 시 재시도
// ──────────────────────────────────────────────────────────
function IdleView({
  disabled,
  onRetry,
  onCancel,
}: {
  disabled: boolean;
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <View style={styles.topSection}>
        <Ionicons
          name="alert-circle"
          size={64}
          color={Colors.semantic.warning}
        />
        <AppText variant="h1" style={styles.headline}>
          호출 실패
        </AppText>
        <AppText variant="body" color="secondary" style={styles.descBody}>
          잠시 후 다시 시도해주세요.
        </AppText>
      </View>

      <Pressable
        onPress={onRetry}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="다시 긴급 호출"
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
          disabled && styles.disabled,
        ]}
      >
        <Ionicons name="warning" size={24} color={Colors.text.inverse} />
        <AppText variant="bodyBold" color="inverse" style={styles.buttonLabel}>
          다시 호출
        </AppText>
      </Pressable>

      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="처음으로"
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.secondaryButtonPressed,
        ]}
      >
        <AppText variant="bodyBold" color="primary">
          처음으로
        </AppText>
      </Pressable>
    </>
  );
}

// ──────────────────────────────────────────────────────────
// done — 결과
// ──────────────────────────────────────────────────────────
function DoneView({
  result,
  onCallEmergency,
  onGoHome,
}: {
  result: SosEvent;
  onCallEmergency: () => void;
  onGoHome: () => void;
}) {
  const hasGuardian = result.notifiedGuardianCount > 0;
  return (
    <>
      <View style={[styles.resultIcon, hasGuardian && styles.resultIconOk]}>
        <Ionicons
          name={hasGuardian ? "checkmark-circle" : "alert-circle"}
          size={88}
          color={Colors.text.inverse}
        />
      </View>

      <AppText variant="h1" style={styles.resultTitle}>
        {hasGuardian ? "알림을 보냈어요" : "연결된 보호자가 없어요"}
      </AppText>

      <AppText variant="body" color="secondary" style={styles.resultBody}>
        {hasGuardian
          ? `보호자 ${
              result.notifiedGuardianCount
            }명에게${"\n"}긴급 호출을 알렸어요.`
          : `지금은 119에 직접${"\n"}전화해주세요.`}
      </AppText>

      <Pressable
        onPress={onCallEmergency}
        accessibilityRole="button"
        accessibilityLabel="119에 전화 걸기"
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
        ]}
      >
        <Ionicons name="call" size={24} color={Colors.text.inverse} />
        <AppText variant="bodyBold" color="inverse" style={styles.buttonLabel}>
          119에 전화하기
        </AppText>
      </Pressable>

      <Pressable
        onPress={onGoHome}
        accessibilityRole="button"
        accessibilityLabel="처음으로"
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.secondaryButtonPressed,
        ]}
      >
        <AppText variant="bodyBold" color="primary">
          처음으로
        </AppText>
      </Pressable>
    </>
  );
}

// ──────────────────────────────────────────────────────────
// 스타일
// ──────────────────────────────────────────────────────────
const COUNTDOWN_SIZE = 200;
const CANCEL_BUTTON_HEIGHT = 96;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing.xl,
  },
  topSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  headline: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  descBody: {
    textAlign: "center",
  },

  // counting
  countdownWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownCircle: {
    width: COUNTDOWN_SIZE,
    height: COUNTDOWN_SIZE,
    borderRadius: COUNTDOWN_SIZE / 2,
    backgroundColor: Colors.semantic.danger,
    alignItems: "center",
    justifyContent: "center",
    ...Elevation.lg,
  },
  countdownNumber: {
    fontSize: 96,
    lineHeight: 96,
    fontWeight: "800",
  },
  bigCancelButton: {
    width: "100%",
    height: CANCEL_BUTTON_HEIGHT,
    borderRadius: Radius.xl,
    backgroundColor: Colors.text.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    ...Elevation.md,
  },
  bigCancelButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  bigCancelLabel: {
    fontWeight: "700",
  },

  // pending
  centerFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingText: {
    marginTop: Spacing.lg,
  },

  // done
  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.semantic.warning,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    ...Elevation.md,
  },
  resultIconOk: {
    backgroundColor: Colors.semantic.success,
  },
  resultTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  resultBody: {
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },

  // shared buttons
  primaryButton: {
    flexDirection: "row",
    minWidth: 240,
    minHeight: 64,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    backgroundColor: Colors.semantic.danger,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Elevation.md,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    marginLeft: Spacing.xs,
  },
  secondaryButton: {
    minWidth: 240,
    minHeight: 56,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface.card,
    borderWidth: 2,
    borderColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonPressed: {
    backgroundColor: Colors.brand.primaryLight,
  },
  disabled: {
    opacity: 0.5,
  },
});
