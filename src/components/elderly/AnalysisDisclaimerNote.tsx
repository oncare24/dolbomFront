// 복약 분석 결과 화면 책임 한계 안내.
// Graph RAG 결과를 의료 진단이 아닌 의견으로 전달함을 명시.
// 케이스 1(위험 있음)·2(위험 없음) hero 아래 공통 노출.

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../common/Text";
import { Colors, Spacing } from "../../theme";

export function AnalysisDisclaimerNote() {
  return (
    <View style={styles.row}>
      <Ionicons
        name="information-circle-outline"
        size={18}
        color={Colors.text.secondary}
        style={styles.icon}
      />
      <AppText
        variant="caption"
        audience="elderly"
        color="secondary"
        style={styles.text}
      >
        이 결과는 참고용이에요. 의사·약사와 상담해 주세요.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  icon: {
    marginTop: 2,
  },
  text: {
    flex: 1,
  },
});
