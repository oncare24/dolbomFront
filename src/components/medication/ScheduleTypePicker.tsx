// 매일 vs 요일 지정 세그먼트 컨트롤.
// iOS 시스템 segmented, 토스 큰글씨 빈도 토글 패턴 참고.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../common/Text";
import { Colors, Radius, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";
import type { MedicationScheduleType } from "../../types/medication";

interface Props {
  value: MedicationScheduleType;
  onChange: (value: MedicationScheduleType) => void;
  audience?: "elderly" | "guardian";
}

const OPTIONS: { value: MedicationScheduleType; label: string }[] = [
  { value: "DAILY", label: "매일" },
  { value: "WEEKLY", label: "요일 지정" },
];

export function ScheduleTypePicker({
  value,
  onChange,
  audience = "elderly",
}: Props) {
  const isElderly = audience === "elderly";

  const handleSelect = (next: MedicationScheduleType) => {
    if (next === value) return;
    haptic.light();
    onChange(next);
  };

  return (
    <View
      style={[
        styles.container,
        isElderly ? styles.containerElderly : styles.containerGuardian,
      ]}
    >
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => handleSelect(opt.value)}
            android_ripple={
              selected
                ? undefined
                : { color: Colors.gray[200], borderless: false }
            }
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected }}
            style={[
              styles.option,
              isElderly ? styles.optionElderly : styles.optionGuardian,
              selected && styles.optionSelected,
            ]}
          >
            <AppText
              variant={isElderly ? "bodyBold" : "body"}
              audience={audience}
              style={{
                color: selected ? Colors.brand.primary : Colors.text.secondary,
                fontWeight: selected ? "700" : "500",
              }}
            >
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.surface.background,
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
  },
  containerElderly: { minHeight: 64 },
  containerGuardian: { minHeight: 56 },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md - 2,
  },
  optionElderly: { paddingVertical: Spacing.md },
  optionGuardian: { paddingVertical: Spacing.sm },
  optionSelected: {
    backgroundColor: Colors.surface.card,
  },
});
