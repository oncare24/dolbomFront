// 보호자 ProtegeDetail 화면 — 피보호자 활동 이상(미활동) 분석 배너.
//
// 친구가 만든 ProtegeMedicationAnalysisBanner 와 동일한 Card 레이아웃·분기 구조를
// 따른다. 그 화면에서 "약물 안전 분석" 배너 바로 아래에 나란히 놓는 것을 전제.
//
// 데이터: 백엔드 이상탐지 엔진(InactivityAnalysisService)이 위치 이벤트마다 분석해
//   WardAnalysisState 에 저장한 결과를 GET /api/wards/{id}/analysis-state 로 조회.
//
// 표시 분기:
//  - 로딩 중
//  - 분석 이력 없음 (응답 inactivity=null) → "아직 분석 전" 안내
//  - statusCode 0 ACTIVE   → "정상"      (성공/녹색)
//  - statusCode 1 INACTIVE → "주의"      (경고/주황) ← 4h 경고 / 8h 위험
//  - statusCode 2 UNKNOWN  → "확인 불가" (중립/회색)
//  - 기타 에러
//
// ※ 약물 안전 분석 배너와 달리 별도 상세 화면이 없어 onPress 없는 정적 카드.

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../common/Card";
import { AppText } from "../common/Text";
import { Colors, Radius, Spacing } from "../../theme";
import { formatRelativeMinutes } from "../../utils/timeFormat";
import { useWardAnalysisState } from "../../hooks/useWardAnalysisState";
import type { InactivityStatusCode } from "../../types/analysisState";

interface Props {
  protegeId: number;
  protegeName: string;
}

interface Visual {
  bg: string;
  iconBg: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  /** 상태 설명 문구 (분석 시각은 별도로 뒤에 붙음). */
  phrase: string;
  outdatedTone: boolean;
}

const STATUS_VISUAL: Record<InactivityStatusCode, Visual> = {
  0: {
    bg: Colors.semantic.successBg,
    iconBg: Colors.semantic.success,
    icon: "walk",
    title: "정상",
    phrase: "정상적으로 활동 중이에요",
    outdatedTone: false,
  },
  1: {
    bg: Colors.semantic.warningBg,
    iconBg: Colors.semantic.warning,
    icon: "alert-circle",
    title: "주의",
    phrase: "장시간 활동이 감지되지 않았어요",
    outdatedTone: true,
  },
  2: {
    bg: Colors.gray[100],
    iconBg: Colors.gray[500],
    icon: "location-outline",
    title: "확인 불가",
    phrase: "위치를 확인할 수 없어요",
    outdatedTone: false,
  },
};

/** "마지막 분석 3분 전" 꼴. 분석 시각이 없으면 빈 문자열. */
function analyzedSuffix(analyzedMinutesAgo: number | null): string {
  if (analyzedMinutesAgo == null) return "";
  return ` · 마지막 분석 ${formatRelativeMinutes(analyzedMinutesAgo)}`;
}

export function InactivityAnalysisBanner({ protegeId, protegeName }: Props) {
  const { data, isLoading, isError } = useWardAnalysisState(protegeId);

  // ─── 로딩 ───
  if (isLoading) {
    return (
      <Card variant="elevated" style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: Colors.gray[200] }]}>
            <Ionicons name="walk" size={22} color={Colors.gray[500]} />
          </View>
          <View style={styles.textWrap}>
            <AppText variant="bodyBold" audience="guardian">
              활동 이상 분석
            </AppText>
            <AppText
              variant="caption"
              audience="guardian"
              color="secondary"
              style={styles.subtitle}
            >
              불러오는 중…
            </AppText>
          </View>
        </View>
      </Card>
    );
  }

  // ─── 에러 ───
  // analysis-state API 는 분석 이력이 없으면 에러가 아니라 inactivity=null 을 주므로,
  // 여기 들어오면 통신/권한 등 실제 실패.
  if (isError || !data) {
    return (
      <Card variant="outlined" style={styles.card}>
        <View style={styles.row}>
          <Ionicons
            name="alert-circle-outline"
            size={22}
            color={Colors.semantic.warning}
          />
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            style={styles.errorText}
          >
            활동 이상 분석을 불러오지 못했어요
          </AppText>
        </View>
      </Card>
    );
  }

  const inactivity = data.inactivity;

  // ─── 분석 이력 없음 ───
  if (!inactivity) {
    return (
      <Card variant="elevated" style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: Colors.gray[100] }]}>
            <Ionicons name="hourglass-outline" size={22} color={Colors.gray[600]} />
          </View>
          <View style={styles.textWrap}>
            <AppText variant="bodyBold" audience="guardian">
              활동 이상 분석
            </AppText>
            <AppText
              variant="caption"
              audience="guardian"
              color="secondary"
              style={styles.subtitle}
            >
              {protegeName}님의 활동 데이터를 모으는 중이에요
            </AppText>
          </View>
        </View>
      </Card>
    );
  }

  // ─── 정상 결과 ───
  const visual = STATUS_VISUAL[inactivity.statusCode] ?? STATUS_VISUAL[2];
  const subtitle = `${visual.phrase}${analyzedSuffix(
    inactivity.analyzedMinutesAgo,
  )}`;

  return (
    <Card
      variant="elevated"
      style={[styles.card, { backgroundColor: visual.bg }]}
      accessibilityLabel={`활동 이상 분석 ${visual.title}, ${visual.phrase}`}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: visual.iconBg }]}>
          <Ionicons name={visual.icon} size={22} color={Colors.text.inverse} />
        </View>
        <View style={styles.textWrap}>
          <AppText variant="bodyBold" audience="guardian">
            활동 이상 분석 · {visual.title}
          </AppText>
          <AppText
            variant="caption"
            audience="guardian"
            color={visual.outdatedTone ? "danger" : "secondary"}
            style={styles.subtitle}
          >
            {subtitle}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  errorText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
});
