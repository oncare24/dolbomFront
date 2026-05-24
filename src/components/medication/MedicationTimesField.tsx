// src/components/medication/MedicationTimesField.tsx
// 복용 시간 여러 개 입력. 시간 행 + 삭제(×) + "시간 추가". 추가는 빈 값(직접 선택).

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { TimePickerField } from "./TimePickerField";
import { Colors, Radius, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  audience: "elderly" | "guardian";
  error?: string;
}

export function MedicationTimesField({
  value,
  onChange,
  audience,
  error,
}: Props) {
  const times = value.length > 0 ? value : [""];

  const updateAt = (i: number, t: string) => {
    const next = [...times];
    next[i] = t;
    onChange(next);
  };
  const removeAt = (i: number) => {
    haptic.light();
    onChange(times.filter((_, idx) => idx !== i));
  };
  const add = () => {
    haptic.light();
    onChange([...times, ""]); // 빈 값으로 추가 → 사용자가 직접 선택
  };

  return (
    <View style={{ gap: Spacing.sm }}>
      {times.map((t, i) => (
        <View key={i} style={styles.row}>
          <View style={{ flex: 1 }}>
            <TimePickerField
              value={t}
              onChange={(next) => updateAt(i, next)}
              audience={audience}
            />
          </View>
          {times.length > 1 && (
            <Pressable
              onPress={() => removeAt(i)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="시간 삭제"
              style={styles.remove}
            >
              <Ionicons name="close" size={20} color={Colors.text.disabled} />
            </Pressable>
          )}
        </View>
      ))}

      <Pressable
        onPress={add}
        accessibilityRole="button"
        accessibilityLabel="시간 추가"
        android_ripple={{ color: Colors.gray[200] }}
        style={styles.addBtn}
      >
        <Ionicons name="add" size={20} color={Colors.brand.primary} />
        <AppText
          variant="body"
          audience={audience}
          style={{ color: Colors.brand.primary }}
        >
          시간 추가
        </AppText>
      </Pressable>

      {error ? (
        <AppText
          variant="caption"
          audience={audience}
          style={{ color: Colors.semantic.danger }}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  remove: { padding: Spacing.sm },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.surface.divider,
  },
});
