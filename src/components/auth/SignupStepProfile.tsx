// front/src/components/auth/SignupStepProfile.tsx
// Step 2: 프로필 입력 (휴대폰 + 이름 + ELDER일 때 나이 + 임신 여부).
//
// 키보드 처리: KeyboardAwareScrollView(입력 자동 스크롤) + KeyboardStickyView(다음 버튼 sticky 고정).
// contentContainerStyle 에 flexGrow:1 + space-between 을 두면 키보드 올라올 때
// 컨텐츠 영역이 reflow 되어 footer 가 점프하듯 위로 밀려 올라옴 (lib mode="layout" 동작).
// → footer 를 KeyboardStickyView 로 분리해서 translation 만으로 키보드 위에 부드럽게 붙임.

import React, { useCallback } from "react";
import { StyleSheet, View, Pressable, Keyboard } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useFormContext } from "react-hook-form";
import { AppText } from "../common/Text";
import { AppTextInput } from "../common/Input";
import { PrimaryButton } from "../common/Button";
import { Colors, Spacing, Radius, Touch, Elevation } from "../../theme";
import { haptic } from "../../utils/haptics";
import { SignupFormValues } from "../../schemas/signupSchema";

interface Props {
  onNext: () => void;
}

// PrimaryButton + footer paddings. 정확한 값은 실기기에서 확인 후 미세조정.
const STICKY_FOOTER_HEIGHT = 96;

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function SignupStepProfile({ onNext }: Props) {
  const { control, watch, trigger } = useFormContext<SignupFormValues>();
  const insets = useSafeAreaInsets();

  const role = watch("role");
  const phone = watch("phone");
  const name = watch("name");
  const age = watch("age");
  const isPregnant = watch("isPregnant");
  const isElderly = role === "elderly";

  const validateStep = useCallback(async () => {
    const fields: Array<keyof SignupFormValues> = ["phone", "name"];
    if (isElderly) fields.push("age", "isPregnant");
    return trigger(fields);
  }, [trigger, isElderly]);

  const handleNext = async () => {
    Keyboard.dismiss();
    const ok = await validateStep();
    if (ok) onNext();
  };

  const canSubmit = (() => {
    const phoneOk = /^010-\d{4}-\d{4}$/.test(phone ?? "");
    const nameOk = (name ?? "").trim().length >= 2;
    if (!isElderly) return phoneOk && nameOk;
    const ageNum = Number(age);
    const ageOk =
      !!age && Number.isInteger(ageNum) && ageNum >= 1 && ageNum <= 120;
    const pregOk = typeof isPregnant === "boolean";
    return phoneOk && nameOk && ageOk && pregOk;
  })();

  // closed=0: 키보드 닫힘 시 본래 위치 그대로
  // opened=0: 키보드 바로 위에 정확히 붙음 (간격 0)
  const stickyOffset = { closed: 0, opened: 0 };

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        // sticky footer 만큼 추가 여유. focused input 이 footer 뒤에 가리지 않게.
        bottomOffset={STICKY_FOOTER_HEIGHT}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fields}>
          <Controller
            control={control}
            name="phone"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <AppTextInput
                label="휴대폰 번호"
                placeholder="010-0000-0000"
                value={value ?? ""}
                onChangeText={(t) => onChange(formatPhone(t))}
                onBlur={onBlur}
                keyboardType="number-pad"
                maxLength={13}
                error={error?.message}
                autoFocus
                audience="elderly"
              />
            )}
          />

          <Controller
            control={control}
            name="name"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <AppTextInput
                label="이름"
                placeholder="홍길동"
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                maxLength={20}
                error={error?.message}
                audience="elderly"
              />
            )}
          />

          {isElderly && (
            <>
              <Controller
                control={control}
                name="age"
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <AppTextInput
                    label="나이 (만)"
                    placeholder="75"
                    value={value ?? ""}
                    onChangeText={(t) =>
                      onChange(t.replace(/\D/g, "").slice(0, 3))
                    }
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={3}
                    error={error?.message}
                    audience="elderly"
                  />
                )}
              />

              <Controller
                control={control}
                name="isPregnant"
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <View style={styles.pregnantWrap}>
                    <AppText
                      variant="caption"
                      color="primary"
                      style={styles.pregnantLabel}
                      audience="elderly"
                    >
                      임신 여부
                    </AppText>
                    <View style={styles.pregnantRow}>
                      <PregnantChoice
                        label="아니오"
                        selected={value === false}
                        onPress={() => {
                          haptic.light();
                          onChange(false);
                        }}
                      />
                      <PregnantChoice
                        label="예"
                        selected={value === true}
                        onPress={() => {
                          haptic.light();
                          onChange(true);
                        }}
                      />
                    </View>
                    {error?.message && (
                      <AppText
                        variant="caption"
                        color="danger"
                        style={styles.pregnantError}
                      >
                        {error.message}
                      </AppText>
                    )}
                  </View>
                )}
              />
            </>
          )}
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={stickyOffset} style={styles.stickyWrap}>
        <View
          style={[styles.footer, { paddingBottom: Spacing.md + insets.bottom }]}
        >
          <PrimaryButton
            label="다음"
            onPress={handleNext}
            disabled={!canSubmit}
            audience="elderly"
          />
        </View>
      </KeyboardStickyView>
    </View>
  );
}

interface PregnantChoiceProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function PregnantChoice({ label, selected, onPress }: PregnantChoiceProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: Colors.brand.primaryLight, borderless: false }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <AppText
        variant="h3"
        color={selected ? "inverse" : "primary"}
        audience="elderly"
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // ⚠️ justifyContent: "space-between" 제거됨 — 키보드 reflow 시 footer 점프 원인이었음.
    paddingBottom: Spacing.lg,
  },
  fields: {
    gap: Spacing.lg,
  },
  stickyWrap: {
    backgroundColor: Colors.surface.background,
  },
  footer: {
    paddingTop: Spacing.md,
    paddingHorizontal: 0, // 부모 stepWrap 에서 horizontal padding 줌
    backgroundColor: Colors.surface.background,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.divider,
  },
  pregnantWrap: {
    gap: Spacing.sm,
  },
  pregnantLabel: {
    marginBottom: Spacing.xs,
  },
  pregnantRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  choice: {
    flex: 1,
    minHeight: Touch.senior,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.surface.divider,
    backgroundColor: Colors.surface.card,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    ...Elevation.xs,
  },
  choiceSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary,
  },
  pregnantError: {
    marginTop: Spacing.xs,
  },
});
