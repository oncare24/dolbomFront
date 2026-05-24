// src/components/medication/MedicationPeriodPicker.tsx
// 계속 복용 / 기간 지정 토글 + 시작일·종료일 (안드로이드 기본 달력).

import React, { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Pressable } from "react-native-gesture-handler";
import { AppText } from "../common/Text";
import { Colors, Radius, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";

export type PeriodType = "CONTINUOUS" | "RANGED";

interface Props {
  periodType: PeriodType;
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string;
  onChangeType: (t: PeriodType) => void;
  onChangeStart: (iso: string) => void;
  onChangeEnd: (iso: string) => void;
  error?: string;
  audience?: "elderly" | "guardian";
}

const OPTIONS: { value: PeriodType; label: string }[] = [
  { value: "CONTINUOUS", label: "계속 복용" },
  { value: "RANGED", label: "기간 지정" },
];

function dateToIso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function isoToDate(iso?: string): Date {
  if (!iso) return new Date();
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

function formatKorean(iso?: string): string {
  if (!iso) return "선택";
  const [y, m, d] = iso.split("-");
  return `${y}. ${parseInt(m, 10)}. ${parseInt(d, 10)}.`;
}

export function MedicationPeriodPicker({
  periodType,
  startDate,
  endDate,
  onChangeType,
  onChangeStart,
  onChangeEnd,
  error,
  audience = "guardian",
}: Props) {
  const isElderly = audience === "elderly";
  const [open, setOpen] = useState<null | "start" | "end">(null);

  const selectType = (t: PeriodType) => {
    if (t === periodType) return;
    haptic.light();
    onChangeType(t);
    if (t === "RANGED") {
      const today = dateToIso(new Date());
      if (!startDate) onChangeStart(today);
      if (!endDate) onChangeEnd(today);
    }
  };

  return (
    <View>
      <View
        style={[
          styles.segment,
          isElderly ? styles.segElderly : styles.segGuardian,
        ]}
      >
        {OPTIONS.map((opt) => {
          const selected = periodType === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => selectType(opt.value)}
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
                isElderly ? styles.optElderly : styles.optGuardian,
                selected && styles.optSelected,
              ]}
            >
              <AppText
                variant={isElderly ? "bodyBold" : "body"}
                audience={audience}
                style={{
                  color: selected
                    ? Colors.brand.primary
                    : Colors.text.secondary,
                  fontWeight: selected ? "700" : "500",
                }}
              >
                {opt.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {periodType === "RANGED" && (
        <View style={styles.dateWrap}>
          <DateRow
            label="시작일"
            value={startDate}
            audience={audience}
            onPress={() => setOpen("start")}
          />
          <DateRow
            label="종료일"
            value={endDate}
            audience={audience}
            onPress={() => setOpen("end")}
          />
          {!!error && (
            <AppText
              variant="caption"
              audience={audience}
              style={{ color: Colors.semantic.danger, marginTop: Spacing.xs }}
            >
              {error}
            </AppText>
          )}
        </View>
      )}

      {open && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === "android" ? "calendar" : "spinner"}
          value={isoToDate(open === "start" ? startDate : endDate)}
          onChange={(event, picked) => {
            setOpen(null);
            if (event.type === "set" && picked) {
              const iso = dateToIso(picked);
              if (open === "start") onChangeStart(iso);
              else onChangeEnd(iso);
            }
          }}
        />
      )}
    </View>
  );
}

function DateRow({
  label,
  value,
  onPress,
  audience,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  audience: "elderly" | "guardian";
}) {
  return (
    <Pressable
      onPress={() => {
        haptic.light();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${formatKorean(value)}`}
      style={styles.dateRow}
    >
      <AppText variant="body" audience={audience} color="secondary">
        {label}
      </AppText>
      <AppText variant="bodyBold" audience={audience}>
        {formatKorean(value)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: "row",
    backgroundColor: Colors.surface.background,
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
  },
  segElderly: { minHeight: 64 },
  segGuardian: { minHeight: 56 },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md - 2,
  },
  optElderly: { paddingVertical: Spacing.md },
  optGuardian: { paddingVertical: Spacing.sm },
  optSelected: { backgroundColor: Colors.surface.card },
  dateWrap: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.divider,
    gap: Spacing.sm,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.surface.divider,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 56,
  },
});
