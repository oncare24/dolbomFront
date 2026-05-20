// 새 약 등록 시 "처방전 분석 업데이트 안내" 인라인 배너.
//
// 노출 조건:
//   - 분석 이력 존재 (D001 아님)
//   - 등록된 약 1개 이상
//   - 가장 최근 약 createdAt > 마지막 analyzedAt
//   - 사용자가 최근 약 등록 이후에 dismiss 안 함
//
// dismiss 상태는 AsyncStorage에 저장 — 키 분리: 사용자 × 분석 대상.
// 새 분석을 받으면 analyzedAt 갱신 → 그 이후 또 새 약 등록 시 자동 재노출.
//
// 시각 비교는 모두 epoch ms 기반 (UTC `Z` ISO ↔ 백엔드 LocalDateTime 혼재 안전).

import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "../common/Card";
import { AppText } from "../common/Text";
import { Colors, Radius, Spacing } from "../../theme";
import {
  useSelfMedicationAnalysis,
  useWardMedicationAnalysis,
} from "../../hooks/useDrugSafety";
import { useMedicationSchedules } from "../../hooks/useMedications";
import { useAuthStore } from "../../stores/authStore";
import { ApiException } from "../../services/api";
import { haptic } from "../../utils/haptics";
import { nowLocalDateTimeIso } from "../../utils/medicationSummary";

interface Props {
  /** 피보호자(본인 분석): undefined. 보호자(피보호자 분석): 해당 피보호자 ID. */
  protegeId?: number;
  audience: "elderly" | "guardian";
  onPress: () => void;
}

const DISMISS_KEY_PREFIX = "drugSafetyHint";

export function MedicationAnalysisHintBanner({
  protegeId,
  audience,
  onPress,
}: Props) {
  const myId = useAuthStore((s) => s.user?.id);

  // ─── 분석 결과 조회 (시점에 따라 self / ward 분기) ───
  const selfQuery = useSelfMedicationAnalysis({
    enabled: protegeId === undefined,
  });
  const wardQuery = useWardMedicationAnalysis(protegeId ?? 0, {
    enabled: protegeId !== undefined && protegeId > 0,
  });

  const analysisData =
    protegeId === undefined ? selfQuery.data : wardQuery.data;
  const analysisError =
    protegeId === undefined ? selfQuery.error : wardQuery.error;
  const analysisIsError =
    protegeId === undefined ? selfQuery.isError : wardQuery.isError;

  // ─── 약 목록 (createdAt 비교용) ───
  const targetId = protegeId ?? myId ?? 0;
  const { data: schedules = [] } = useMedicationSchedules(targetId, {
    enabled: targetId > 0,
  });

  // ─── dismiss 상태 ───
  const dismissKey = `${DISMISS_KEY_PREFIX}:${myId ?? "anon"}:${targetId}`;
  const [dismissedAt, setDismissedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(dismissKey)
      .then((v) => {
        if (!cancelled) {
          setDismissedAt(v);
          setHydrated(true);
        }
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [dismissKey]);

  // hydration 전엔 깜빡임 방지를 위해 null
  if (!hydrated) return null;

  // 분석 이력 없음 → 노출 X (홈 카드가 이미 시작 유도)
  const noAnalysis =
    analysisIsError &&
    analysisError instanceof ApiException &&
    analysisError.code === "D001";
  if (noAnalysis) return null;

  // 데이터 없음(로딩/에러) → 노출 X
  if (!analysisData) return null;

  // 약 0개 → 노출 X
  if (schedules.length === 0) return null;

  // 가장 최근 약 등록 시각
  const latestScheduleAt = schedules.reduce<string | null>((latest, s) => {
    if (!s.createdAt) return latest;
    if (latest === null) return s.createdAt;
    return s.createdAt > latest ? s.createdAt : latest;
  }, null);
  if (!latestScheduleAt) return null;

  // 최근 약이 마지막 분석보다 이전 → 새 약 아님 → 노출 X
  if (latestScheduleAt <= analysisData.analyzedAt) return null;

  // 최근 약 등록 이후에 사용자가 dismiss → 노출 X
  // epoch ms 비교: UTC `Z` ISO와 LocalDateTime이 혼재해도 절대 시각으로 정확히 비교.
  if (dismissedAt) {
    const dismissedMs = Date.parse(dismissedAt);
    const latestMs = Date.parse(latestScheduleAt);
    if (!isNaN(dismissedMs) && !isNaN(latestMs) && dismissedMs >= latestMs) {
      return null;
    }
  }

  // ─── 노출 결정 ───
  const handleBodyPress = () => {
    haptic.light();
    onPress();
  };

  const handleDismiss = async () => {
    haptic.light();
    const now = nowLocalDateTimeIso();
    try {
      await AsyncStorage.setItem(dismissKey, now);
    } catch {
      // 저장 실패해도 화면에선 우선 숨김 처리
    }
    setDismissedAt(now);
  };

  const title =
    audience === "elderly" ? "새 처방을 받으셨나요?" : "새 약이 추가됐어요";

  const subtitle =
    audience === "elderly"
      ? "약을 새로 등록하셨어요. 처방전 안전 분석을 업데이트해 보세요."
      : "최근 등록된 약이 있어요. 약물 안전 분석을 업데이트해 보세요.";

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.row}>
        {/* 본문 영역: 누르면 onPress (분석 화면 이동) */}
        <Pressable
          onPress={handleBodyPress}
          android_ripple={{ color: Colors.gray[200], borderless: false }}
          accessibilityRole="button"
          accessibilityLabel={title}
          style={styles.bodyPressable}
        >
          <View style={styles.iconWrap}>
            <Ionicons
              name="information-circle"
              size={28}
              color={Colors.semantic.info}
            />
          </View>
          <View style={styles.textWrap}>
            <AppText variant="bodyBold" audience={audience}>
              {title}
            </AppText>
            <AppText
              variant="caption"
              audience={audience}
              color="secondary"
              style={styles.subtitle}
            >
              {subtitle}
            </AppText>
          </View>
        </Pressable>

        {/* X 버튼: 별도 sibling Pressable — 부모와 충돌 없음 */}
        <Pressable
          onPress={handleDismiss}
          hitSlop={12}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="안내 닫기"
        >
          <Ionicons name="close" size={20} color={Colors.text.secondary} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.semantic.infoBg,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bodyPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  iconWrap: {
    marginTop: 2,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    marginTop: 2,
    lineHeight: 20,
  },
  closeBtn: {
    padding: 4,
    borderRadius: Radius.full,
    marginLeft: Spacing.xs,
  },
});
