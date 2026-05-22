// src/components/medication/MedicationScheduleListEmpty.tsx

// 복약 일정 빈 상태 — 큰 일러스트 + 명확한 다음 액션 버튼.
// Medisafe / MyTherapy 빈 상태 패턴. FAB은 처음 사용자에게 안 보이므로 본문에 큰 버튼.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Radius, Spacing, Touch } from "../../theme";
import { haptic } from "../../utils/haptics";

interface Props {
  audience: "elderly" | "guardian";
  onAddPress: () => void;
  wardName?: string;
}

export function MedicationScheduleListEmpty({
  audience,
  wardName,
  onAddPress,
}: Props) {
  const isElderly = audience === "elderly";

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
        audience={audience}
        color="primary"
        style={styles.title}
      >
        등록된 약이 없어요
      </AppText>
      <AppText
        variant="body"
        audience={audience}
        color="secondary"
        style={styles.desc}
      >
        {isElderly
          ? "아래 버튼을 눌러 약을 추가해보세요"
          : wardName
          ? `${wardName}님의 새 복약 일정을 추가해보세요`
          : "새 복약 일정을 추가해보세요"}
      </AppText>
      <Pressable
        onPress={handlePress}
        android_ripple={{ color: Colors.brand.primaryDark }}
        accessibilityRole="button"
        accessibilityLabel="새 약 추가"
        style={[
          styles.button,
          isElderly ? styles.buttonElderly : styles.buttonGuardian,
        ]}
      >
        <Ionicons
          name="add"
          size={isElderly ? 26 : 22}
          color={Colors.text.inverse}
        />
        <AppText variant="bodyBold" audience={audience} color="inverse">
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
  },
  buttonElderly: {
    minHeight: Touch.senior,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  buttonGuardian: {
    minHeight: Touch.comfortable,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
});
