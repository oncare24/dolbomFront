// Step 2: 프로필 입력 (휴대폰 + 이름)
// 휴대폰: 자동 하이픈 포맷 (010-0000-0000).
// 이름: 한글 2~20자.
// react-hook-form + Controller로 AppTextInput과 연동.
// 검증 통과 시에만 "다음" 버튼 활성화.

import React, { useCallback } from "react";
import { StyleSheet, View, Keyboard } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { AppTextInput } from "../common/Input";
import { PrimaryButton } from "../common/Button";
import { Spacing } from "../../theme";
import { profileSchema, SignupFormValues } from "../../schemas/signupSchema";

interface Props {
  onNext: () => void;
}

// 010-0000-0000 자동 하이픈
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

  // 이 step에서만 검증할 필드들
  const validateStep = useCallback(async () => {
    // 우선 form 자체 검증 트리거
    const ok = await trigger(["phone", "name"]);
    if (!ok) return false;
    // zod sub-schema로 한 번 더 (방어적)
    const result = profileSchema.safeParse({ phone, name });
    return result.success;
  }, [trigger, phone, name]);

  const handleNext = async () => {
    Keyboard.dismiss();
    const ok = await validateStep();
    if (ok) onNext();
  };

  // 버튼 활성 조건: 형식상 입력이 다 찼을 때만 (디테일 검증은 onChange로 표시)
  const canSubmit =
    /^010-\d{4}-\d{4}$/.test(phone ?? "") && (name ?? "").trim().length >= 2;

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
