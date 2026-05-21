// src/components/medication/DayOfWeekPicker.tsx

import React from "react";
import { StyleSheet, View } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { AppText } from "../common/Text";
import { Colors, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";
import type { DayOfWeek } from "../../types/medication";

interface Props {
  value: DayOfWeek[];
  onChange: (value: DayOfWeek[]) => void;
  error?: string;
  audience?: "elderly" | "guardian";
}

const DAY_LABELS: { value: DayOfWeek; label: string }[] = [
  { value: "MONDAY", label: "월" },
  { value: "TUESDAY", label: "화" },
  { value: "WEDNESDAY", label: "수" },
  { value: "THURSDAY", label: "목" },
  { value: "FRIDAY", label: "금" },
  { value: "SATURDAY", label: "토" },
  { value: "SUNDAY", label: "일" },
];

const WEEKEND: DayOfWeek[] = ["SATURDAY", "SUNDAY"];

export function DayOfWeekPicker({
  value,
  onChange,
  error,
  audience = "elderly",
}: Props) {
  const isElderly = audience === "elderly";

  const toggle = (day: DayOfWeek) => {
    haptic.light();
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <View>
      <View style={styles.row}>
        {DAY_LABELS.map(({ value: day, label }) => {
          const selected = value.includes(day);
          const isWeekend = WEEKEND.includes(day);

          const textColor = selected
            ? Colors.text.inverse
            : isWeekend
            ? Colors.semantic.danger
            : Colors.text.primary;

          return (
            <Pressable
              key={day}
              onPress={() => toggle(day)}
              hitSlop={{ top: 12, bottom: 12, left: 2, right: 2 }}
              android_ripple={{
                color: Colors.brand.primaryLight,
                borderless: false,
              }}
              accessibilityRole="button"
              accessibilityLabel={`${label}요일`}
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                {
                  backgroundColor: selected
                    ? Colors.brand.primary
                    : Colors.surface.card,
                  borderColor: selected
                    ? Colors.brand.primary
                    : Colors.gray[300],
                },
              ]}
            >
              <AppText
                variant={isElderly ? "bodyBold" : "body"}
                audience={audience}
                style={{
                  color: textColor,
                  fontWeight: selected ? "700" : "500",
                }}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {error && (
        <AppText
          variant="caption"
          audience={audience}
          color="danger"
          style={styles.error}
        >
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  chip: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  error: {
    marginTop: Spacing.xs,
  },
});
