// src/components/medication/PeriodSegment.tsx

// 오전/오후 토글 (12시간제 입력용).

import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../common/Text";
import { Colors, Radius, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";
import { Pressable } from "react-native-gesture-handler";

export type Period = "AM" | "PM";

interface Props {
  value: Period;
  onChange: (value: Period) => void;
  audience?: "elderly" | "guardian";
}

const OPTIONS: { value: Period; label: string }[] = [
  { value: "AM", label: "오전" },
  { value: "PM", label: "오후" },
];

export function PeriodSegment({
  value,
  onChange,
  audience = "elderly",
}: Props) {
  const isElderly = audience === "elderly";

  const handleSelect = (next: Period) => {
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
  containerElderly: { minHeight: 56 },
  containerGuardian: { minHeight: 48 },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md - 2,
  },
  optionElderly: { paddingVertical: Spacing.sm },
  optionGuardian: { paddingVertical: Spacing.xs },
  optionSelected: {
    backgroundColor: Colors.surface.card,
  },
});
