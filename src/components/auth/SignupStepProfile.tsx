// Step 2: 프로필 입력 (휴대폰 + 이름)
//
// 키보드 처리: KeyboardAwareScrollView로 폼 + 하단 버튼 함께 감싸면
// 키보드가 올라올 때 자동으로 focused input이 visible 영역으로 스크롤되고,
// "다음" 버튼은 키보드 위로 올라옴 (시중 앱 표준 패턴, 토스/카카오뱅크 동일).

import React, { useCallback } from "react";
import { StyleSheet, View, Keyboard } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Controller, useFormContext } from "react-hook-form";
import { AppTextInput } from "../common/Input";
import { PrimaryButton } from "../common/Button";
import { Spacing } from "../../theme";
import { profileSchema, SignupFormValues } from "../../schemas/signupSchema";

interface Props {
  onNext: () => void;
}

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function SignupStepProfile({ onNext }: Props) {
  const { control, watch, trigger } = useFormContext<SignupFormValues>();

  const phone = watch("phone");
  const name = watch("name");

  const validateStep = useCallback(async () => {
    const ok = await trigger(["phone", "name"]);
    if (!ok) return false;
    const result = profileSchema.safeParse({ phone, name });
    return result.success;
  }, [trigger, phone, name]);

  const handleNext = async () => {
    Keyboard.dismiss();
    const ok = await validateStep();
    if (ok) onNext();
  };

  const canSubmit =
    /^010-\d{4}-\d{4}$/.test(phone ?? "") && (name ?? "").trim().length >= 2;

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      bottomOffset={Spacing.lg}
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
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="다음"
          onPress={handleNext}
          disabled={!canSubmit}
          audience="elderly"
        />
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  fields: {
    gap: Spacing.lg,
  },
  footer: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
});
