// src/components/medication/MedicationScheduleListError.tsx

// 복약 일정 로딩 실패 상태.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Radius, Spacing, Touch } from "../../theme";
import { haptic } from "../../utils/haptics";

interface Props {
  audience: "elderly" | "guardian";
  onRetry: () => void;
}

export function MedicationScheduleListError({ audience, onRetry }: Props) {
  const isElderly = audience === "elderly";

  const handlePress = () => {
    haptic.light();
    onRetry();
  };

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
        audience={audience}
        color="primary"
        style={styles.title}
      >
        약 정보를 불러오지 못했어요
      </AppText>
      <AppText
        variant="body"
        audience={audience}
        color="secondary"
        style={styles.desc}
      >
        잠시 후 다시 시도해주세요
      </AppText>
      <Pressable
        onPress={handlePress}
        android_ripple={{ color: Colors.gray[200] }}
        accessibilityRole="button"
        accessibilityLabel="다시 시도"
        style={[
          styles.button,
          isElderly ? styles.buttonElderly : styles.buttonGuardian,
        ]}
      >
        <AppText variant="bodyBold" audience={audience} color="link">
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
    marginBottom: Spacing.xl,
  },
  button: {
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonElderly: {
    minHeight: Touch.senior,
    paddingHorizontal: Spacing.xl,
  },
  buttonGuardian: {
    minHeight: Touch.comfortable,
    paddingHorizontal: Spacing.lg,
  },
});
