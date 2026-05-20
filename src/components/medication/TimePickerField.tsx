// src/components/medication/TimePickerField.tsx

// 12시간제 시간 입력 — 오전/오후 + 시(1~12) + 분(00~59).
// 내부 저장은 24시간 "HH:mm" (백엔드 호환).
// 한글 hint는 입력 영역 아래 별도 줄로 표시 (짤림 방지).

import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "../common/Text";
import { PeriodSegment, type Period } from "./PeriodSegment";
import { Colors, Radius, Spacing } from "../../theme";
import { toKoreanTime } from "../../utils/medicationFormat";

interface Props {
  label?: string;
  value: string; // "HH:mm" 24시간 형식 or ""
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  audience?: "elderly" | "guardian";
}

function parse12(v: string): { period: Period; hh: string; mm: string } {
  if (!v || !/^\d{2}:\d{2}$/.test(v)) return { period: "AM", hh: "", mm: "" };
  const [hStr, mStr] = v.split(":");
  const h24 = Number(hStr);

  let period: Period;
  let h12: number;
  if (h24 === 0) {
    period = "AM";
    h12 = 12;
  } else if (h24 < 12) {
    period = "AM";
    h12 = h24;
  } else if (h24 === 12) {
    period = "PM";
    h12 = 12;
  } else {
    period = "PM";
    h12 = h24 - 12;
  }

  return {
    period,
    hh: String(h12).padStart(2, "0"),
    mm: mStr,
  };
}

function compose24(period: Period, hh: string, mm: string): string {
  if (hh.length !== 2 || mm.length !== 2) return "";
  const h12 = Number(hh);
  if (h12 < 1 || h12 > 12) return "";

  let h24: number;
  if (period === "AM") {
    h24 = h12 === 12 ? 0 : h12;
  } else {
    h24 = h12 === 12 ? 12 : h12 + 12;
  }

  return `${String(h24).padStart(2, "0")}:${mm}`;
}

export function TimePickerField({
  label,
  value,
  onChange,
  onBlur,
  error,
  audience = "elderly",
}: Props) {
  const isElderly = audience === "elderly";
  const minuteRef = useRef<TextInput>(null);

  const initial = parse12(value);
  const [period, setPeriod] = useState<Period>(initial.period);
  const [hh, setHh] = useState(initial.hh);
  const [mm, setMm] = useState(initial.mm);
  const [focused, setFocused] = useState<"hh" | "mm" | null>(null);
  const focusProgress = useSharedValue(0);

  useEffect(() => {
    if (value === "") return;
    if (/^\d{2}:\d{2}$/.test(value)) {
      const parsed = parse12(value);
      setPeriod(parsed.period);
      setHh(parsed.hh);
      setMm(parsed.mm);
    }
  }, [value]);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [focused, focusProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? Colors.semantic.danger
      : focusProgress.value > 0
      ? Colors.brand.primary
      : Colors.gray[300];
    return { borderColor };
  });

  const commit = (nextPeriod: Period, nextHh: string, nextMm: string) => {
    const composed = compose24(nextPeriod, nextHh, nextMm);
    onChange(composed);
  };

  const handlePeriodChange = (next: Period) => {
    setPeriod(next);
    commit(next, hh, mm);
  };

  const handleHourChange = (text: string) => {
    const sanitized = text.replace(/\D/g, "").slice(0, 2);

    if (sanitized.length < 2) {
      setHh(sanitized);
      commit(period, sanitized, mm);
      return;
    }

    const n = Number(sanitized);
    if (n < 1 || n > 12) return;

    setHh(sanitized);
    commit(period, sanitized, mm);
    minuteRef.current?.focus();
  };

  const handleMinuteChange = (text: string) => {
    const sanitized = text.replace(/\D/g, "").slice(0, 2);
    if (sanitized.length === 2 && Number(sanitized) > 59) return;
    setMm(sanitized);
    commit(period, hh, sanitized);
  };

  const handleBlur = () => {
    setFocused(null);
    let paddedHh = hh;
    let paddedMm = mm;

    if (hh.length === 1) {
      const n = Number(hh);
      if (n >= 1 && n <= 9) paddedHh = `0${hh}`;
    }
    if (mm.length === 1) {
      paddedMm = `0${mm}`;
    }

    if (paddedHh !== hh) setHh(paddedHh);
    if (paddedMm !== mm) setMm(paddedMm);
    commit(period, paddedHh, paddedMm);
    onBlur?.();
  };

  const composed24 = compose24(period, hh, mm);
  const koreanHint = composed24 ? toKoreanTime(composed24) : null;

  const numFontSize = isElderly ? 32 : 24;
  const numLineHeight = isElderly ? 40 : 32;

  return (
    <View style={styles.wrapper}>
      {label && (
        <AppText
          variant="caption"
          audience={audience}
          color="primary"
          style={styles.label}
        >
          {label}
        </AppText>
      )}

      <PeriodSegment
        value={period}
        onChange={handlePeriodChange}
        audience={audience}
      />

      <Animated.View
        style={[
          styles.field,
          isElderly ? styles.fieldElderly : styles.fieldGuardian,
          animatedStyle,
        ]}
      >
        <Ionicons
          name="time-outline"
          size={isElderly ? 24 : 20}
          color={Colors.brand.primary}
          style={styles.icon}
        />

        <TextInput
          value={hh}
          onChangeText={handleHourChange}
          onFocus={() => setFocused("hh")}
          onBlur={handleBlur}
          placeholder="00"
          placeholderTextColor={Colors.text.disabled}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel="시"
          selectionColor={Colors.brand.primary}
          allowFontScaling
          maxFontSizeMultiplier={1.3}
          style={[
            styles.input,
            { fontSize: numFontSize, lineHeight: numLineHeight },
          ]}
        />

        <AppText
          audience={audience}
          color="primary"
          style={[
            styles.colon,
            { fontSize: numFontSize, lineHeight: numLineHeight },
          ]}
        >
          :
        </AppText>

        <TextInput
          ref={minuteRef}
          value={mm}
          onChangeText={handleMinuteChange}
          onFocus={() => setFocused("mm")}
          onBlur={handleBlur}
          placeholder="00"
          placeholderTextColor={Colors.text.disabled}
          keyboardType="number-pad"
          maxLength={2}
          accessibilityLabel="분"
          selectionColor={Colors.brand.primary}
          allowFontScaling
          maxFontSizeMultiplier={1.3}
          style={[
            styles.input,
            { fontSize: numFontSize, lineHeight: numLineHeight },
          ]}
        />
      </Animated.View>

      {koreanHint && (
        <AppText
          variant={isElderly ? "bodyBold" : "body"}
          audience={audience}
          color="secondary"
          style={styles.hint}
        >
          {koreanHint}
        </AppText>
      )}

      {error && (
        <AppText
          variant="caption"
          audience={audience}
          color="danger"
          style={styles.errorText}
        >
          {error}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  label: { marginBottom: Spacing.xs },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.background,
    borderWidth: 2,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  fieldElderly: { minHeight: 80, paddingVertical: Spacing.sm },
  fieldGuardian: { minHeight: 64, paddingVertical: Spacing.xs },
  icon: { marginRight: Spacing.sm },
  input: {
    minWidth: 60,
    color: Colors.text.primary,
    fontWeight: "700",
    paddingVertical: 0,
    textAlign: "center",
  },
  colon: {
    marginHorizontal: 2,
    fontWeight: "700",
  },
  hint: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  errorText: { marginTop: Spacing.xs },
});
