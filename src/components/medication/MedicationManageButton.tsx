// src/components/medication/MedicationManageButton.tsx

// 오늘의 약 화면 우상단 "관리" 버튼. 시니어 전용.

import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Colors, Spacing, Touch } from "../../theme";
import { haptic } from "../../utils/haptics";
import { AppText } from "../common/Text";

interface Props {
  onPress: () => void;
}

export function MedicationManageButton({ onPress }: Props) {
  const handlePress = () => {
    haptic.light();
    onPress();
  };
  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: Colors.gray[200] }}
      accessibilityRole="button"
      accessibilityLabel="복약 관리"
      style={styles.button}
    >
      <AppText variant="bodyBold" color="link" audience="elderly">
        관리
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: Touch.comfortable,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
