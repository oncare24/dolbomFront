// 회원가입 Step 3: 비밀번호 (PIN 6자리 + 확인 재입력).
// 키보드 처리는 부모(SignupScreen)의 KeyboardAwareScrollView가 담당.

import React from "react";
import { StyleSheet, View } from "react-native";
import { Controller, useFormContext, useFormState } from "react-hook-form";

import { AppText } from "../common/Text";
import { AppTextInput } from "../common/Input";
import { PrimaryButton } from "../common/Button";

import { Spacing } from "../../theme";
import type { SignupFormValues } from "../../schemas/signupSchema";

interface Props {
  onNext: () => void;
  isSubmitting?: boolean;
}

export function SignupStepPassword({ onNext, isSubmitting }: Props) {
  const { control, trigger } = useFormContext<SignupFormValues>();
  const { errors, isValid } = useFormState<SignupFormValues>({ control });

  const handleNext = async () => {
    const ok = await trigger(["password", "passwordConfirm"]);
    if (ok) onNext();
  };

  return (
    <>
      <AppText variant="body" color="secondary" style={styles.helper}>
        숫자 6자리를 입력해주세요
      </AppText>

      <View style={styles.fields}>
        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppTextInput
              label="비밀번호"
              value={value}
              onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 6))}
              onBlur={onBlur}
              placeholder="숫자 6자리"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="passwordConfirm"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppTextInput
              label="비밀번호 확인"
              value={value}
              onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 6))}
              onBlur={onBlur}
              placeholder="다시 한 번 입력"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              error={errors.passwordConfirm?.message}
            />
          )}
        />
      </View>

      <View style={styles.submitWrap}>
        <PrimaryButton
          label={isSubmitting ? "가입 중..." : "다음"}
          onPress={handleNext}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  helper: {
    marginBottom: Spacing.md,
  },
  fields: {
    gap: Spacing.md,
  },
  submitWrap: {
    marginTop: Spacing.xl,
  },
});
