// 복약 분석 결과 화면 빈 상태 뷰.
// 케이스 3(처방 기록 없음) · 케이스 4(분석 실패) 공통 레이아웃.
// CTA는 호출 측에서 BottomActionBar로 분리(메모리 28번 표준).

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../common/Text";
import { Colors, Spacing } from "../../theme";

type Variant = "no-prescription" | "error";

interface Props {
  variant: Variant;
}

interface VariantConfig {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
}

const CONFIG: Record<Variant, VariantConfig> = {
  "no-prescription": {
    iconName: "document-text-outline",
    iconColor: Colors.text.secondary,
    iconBg: Colors.gray[100],
    title: "분석할 약이 없어요",
    body: "최근 받으신 처방이 없네요.\n처방 분석을 먼저 진행해 주세요.",
  },
  error: {
    iconName: "alert-circle-outline",
    iconColor: Colors.semantic.warning,
    iconBg: Colors.semantic.warningBg,
    title: "지금은 보여드릴 수 없어요",
    body: "잠시 후 다시 시도해 주세요.",
  },
};

export function AnalysisEmptyView({ variant }: Props) {
  const config = CONFIG[variant];

  return (
    <View style={styles.root}>
      <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
        <Ionicons name={config.iconName} size={44} color={config.iconColor} />
      </View>
      <AppText variant="h2" audience="elderly" style={styles.title}>
        {config.title}
      </AppText>
      <AppText
        variant="body"
        audience="elderly"
        color="secondary"
        style={styles.body}
      >
        {config.body}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  body: {
    textAlign: "center",
  },
});
