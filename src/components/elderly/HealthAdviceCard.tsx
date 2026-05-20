// 시니어용 도움말 카드 — 화면 맨 아래 한 번만.
// 경고 카드마다 반복되던 "의사·약사 상담" 메시지를 한 곳에 통합.

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";

export function HealthAdviceCard() {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="medical" size={28} color={Colors.brand.primary} />
      </View>
      <View style={styles.content}>
        <AppText variant="bodyBold" audience="elderly" style={styles.title}>
          궁금한 점이 있으면
        </AppText>
        <AppText variant="bodyBold" audience="elderly">
          의사·약사와 상담해 주세요
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.brand.primaryLight,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Elevation.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface.card,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 2,
  },
});
