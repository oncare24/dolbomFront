// src/components/medication/MedicationTodayError.tsx

// 오늘의 약 화면 로딩 실패 상태. 시니어 전용.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Radius, Spacing } from "../../theme";

interface Props {
  onRetry: () => void;
}

export function MedicationTodayError({ onRetry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons
          name="cloud-offline-outline"
          size={64}
          color={Colors.text.disabled}
        />
      </View>
      <AppText
        variant="h3"
        audience="elderly"
        color="primary"
        style={styles.title}
      >
        약 정보를 불러오지 못했어요
      </AppText>
      <AppText
        variant="body"
        audience="elderly"
        color="secondary"
        style={styles.desc}
      >
        아래로 당겨서 다시 시도해주세요
      </AppText>
      <Pressable
        onPress={onRetry}
        android_ripple={{ color: Colors.gray[200] }}
        accessibilityRole="button"
        accessibilityLabel="다시 시도"
        style={styles.retryButton}
      >
        <AppText variant="bodyBold" color="link" audience="elderly">
          다시 시도
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  desc: {
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.primaryLight,
  },
});
