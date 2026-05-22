import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { AppTextInput } from "../../components/common/Input";
import { PrimaryButton } from "../../components/common/Button";
import { useToast } from "../../components/common/Toast";
import { Colors, Radius, Spacing } from "../../theme";
import {
  codefAuthSchema,
  type CodefAuthFormValues,
} from "../../schemas/drugSafetySchema";
import { useDrugSafetyAuthStore } from "../../stores/drugSafetyAuthStore";
import { useRequestCodefAuth } from "../../hooks/useDrugSafety";
import { ApiException } from "../../services/api";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<
  RootStackParamList,
  "MedicationAnalysisForm"
>;

// 휴대폰 자동 하이픈
function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// 주민번호 자동 하이픈 (6-7)
function formatIdentity(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

export default function MedicationAnalysisFormScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const setAuthInput = useDrugSafetyAuthStore((s) => s.setAuthInput);
  const setSession = useDrugSafetyAuthStore((s) => s.setSession);
  const { mutateAsync, isPending } = useRequestCodefAuth();

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<CodefAuthFormValues>({
    resolver: zodResolver(codefAuthSchema),
    mode: "onChange",
    defaultValues: {
      userName: "",
      identity: "",
      phoneNo: "",
    },
  });

  const onSubmit = useCallback(
    async (values: CodefAuthFormValues) => {
      try {
        const session = await mutateAsync(values);
        setAuthInput(values);
        setSession(session);
        navigation.navigate("MedicationAnalysisWaiting");
      } catch (e) {
        if (!(e instanceof ApiException)) {
          toast.show({
            message: "인증 요청에 실패했어요",
            variant: "error",
          });
        }
      }
    },
    [mutateAsync, setAuthInput, setSession, navigation, toast],
  );

  return (
    <View style={styles.root}>
      <AppHeader title="본인 인증" audience="elderly" />

      <KeyboardAwareScrollView
        style={styles.form}
        contentContainerStyle={[
          styles.formContent,
          { paddingBottom: Spacing.xxl + insets.bottom },
        ]}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        bottomOffset={Spacing.lg}
      >
        <AppText variant="h2" audience="elderly" style={styles.title}>
          본인 정보를{"\n"}입력해 주세요
        </AppText>
        <AppText
          variant="body"
          audience="elderly"
          color="secondary"
          style={styles.subtitle}
        >
          처방전을 안전하게 조회하기 위한 정보예요.
        </AppText>

        <View style={styles.fields}>
          <Controller
            control={control}
            name="userName"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <AppTextInput
                label="이름"
                placeholder="홍길동"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={error?.message}
                maxLength={10}
                audience="elderly"
                autoCapitalize="none"
                autoFocus
              />
            )}
          />

          <Controller
            control={control}
            name="identity"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <AppTextInput
                label="주민등록번호"
                placeholder="000000-0000000"
                value={formatIdentity(value)}
                onChangeText={(t) => onChange(t.replace(/\D/g, ""))}
                onBlur={onBlur}
                error={error?.message}
                keyboardType="number-pad"
                maxLength={14}
                secureTextEntry
                audience="elderly"
              />
            )}
          />

          <Controller
            control={control}
            name="phoneNo"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <AppTextInput
                label="휴대폰 번호"
                placeholder="010-0000-0000"
                value={formatPhone(value)}
                onChangeText={(t) => onChange(t.replace(/\D/g, ""))}
                onBlur={onBlur}
                error={error?.message}
                keyboardType="number-pad"
                maxLength={13}
                audience="elderly"
              />
            )}
          />
        </View>

        <View style={styles.notice}>
          <AppText variant="caption" audience="elderly" color="secondary">
            입력하신 정보는 처방전 조회에만 사용되며,{"\n"}어디에도 저장되지
            않습니다.
          </AppText>
        </View>

        <View style={styles.submitWrap}>
          <PrimaryButton
            label="카카오톡으로 인증"
            audience="elderly"
            loading={isPending}
            disabled={!isValid || isPending}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  fields: {
    gap: Spacing.md,
  },
  notice: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.gray[100],
    borderRadius: Radius.lg,
  },
  submitWrap: {
    marginTop: Spacing.xl,
  },
});
