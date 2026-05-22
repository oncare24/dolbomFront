// src/components/medication/MedicationTodayEmpty.tsx

// 오늘의 약 빈 상태 (등록된 약 0건). 시니어 전용.
// 피보호자도 직접 약 추가 가능 — 큰 액션 버튼 노출 (D의 빈 상태와 일관).

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Radius, Spacing, Touch } from "../../theme";
import { haptic } from "../../utils/haptics";

interface Props {
  onAddPress: () => void;
}

export function MedicationTodayEmpty({ onAddPress }: Props) {
  const handlePress = () => {
    haptic.light();
    onAddPress();
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons
          name="medkit-outline"
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
        등록된 약이 없어요
      </AppText>
      <AppText
        variant="body"
        audience="elderly"
        color="secondary"
        style={styles.desc}
      >
        아래 버튼을 눌러 약을 추가해보세요
      </AppText>
      <Pressable
        onPress={handlePress}
        android_ripple={{ color: Colors.brand.primaryDark }}
        accessibilityRole="button"
        accessibilityLabel="복약 일정 추가"
        style={styles.button}
      >
        <Ionicons name="add" size={26} color={Colors.text.inverse} />
        <AppText variant="bodyBold" audience="elderly" color="inverse">
          복약 일정 추가하기
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
    marginBottom: Spacing.xl,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    minHeight: Touch.senior,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
});
