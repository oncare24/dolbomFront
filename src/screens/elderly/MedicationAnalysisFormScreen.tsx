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
import { useAuthStore } from "../../stores/authStore";
import { useRequestCodefAuth } from "../../hooks/useDrugSafety";
import { ApiException } from "../../services/api";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<
  RootStackParamList,
  "MedicationAnalysisForm"
>;

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
  const user = useAuthStore((s) => s.user);
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
      userName: user?.name ?? "",
      identity: "",
      phoneNo: (user?.phoneNumber ?? "").replace(/\D/g, ""),
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
          주민등록번호를{"\n"}입력해 주세요
        </AppText>
        <AppText
          variant="body"
          audience="elderly"
          color="secondary"
          style={styles.subtitle}
        >
          가입하신 정보로 처방전을 조회해요.
        </AppText>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <AppText variant="caption" audience="elderly" color="secondary">
              이름
            </AppText>
            <AppText variant="body" audience="elderly">
              {user?.name ?? "-"}
            </AppText>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <AppText variant="caption" audience="elderly" color="secondary">
              휴대폰 번호
            </AppText>
            <AppText variant="body" audience="elderly">
              {user?.phoneNumber ?? "-"}
            </AppText>
          </View>
        </View>

        <View style={styles.fields}>
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
                autoFocus
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
  infoCard: {
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.surface.divider,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.surface.divider,
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
