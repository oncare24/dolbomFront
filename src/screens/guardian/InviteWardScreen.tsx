// 보호자가 어르신에게 초대를 보내는 화면.
//
// 흐름: 폰번호+관계 입력 → "초대 보내기" → 백엔드 POST /api/invitations
//       성공 → toast + 뒤로가기 → 홈에 PENDING 카드 표시.
//       도메인 에러(G002~G005)는 폼 하단에 inline 표시.

import React, { useCallback, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { AppTextInput } from "../../components/common/Input";
import { PrimaryButton } from "../../components/common/Button";
import { useToast } from "../../components/common/Toast";
import { useCreateInvitation } from "../../hooks/useInvitations";
import { ApiException } from "../../services/api";
import {
  inviteSchema,
  type InviteFormValues,
} from "../../schemas/inviteSchema";
import { Colors, Spacing, Radius } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "InviteWard">;

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function InviteWardScreen() {
  const navigation = useNavigation<Nav>();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    mode: "onChange",
    defaultValues: { wardPhone: "", relationship: "" },
  });

  const createMutation = useCreateInvitation();
  const wardPhone = watch("wardPhone");

  const onSubmit = useCallback(
    async (values: InviteFormValues) => {
      Keyboard.dismiss();
      setServerError(null);
      try {
        const created = await createMutation.mutateAsync({
          wardPhone: values.wardPhone,
          relationship: values.relationship,
        });
        toast.show({
          message: `${created.wardName}님께 초대를 보냈어요`,
          variant: "success",
        });
        navigation.goBack();
      } catch (err) {
        if (err instanceof ApiException) {
          // 도메인 에러는 폼 하단에 표시 (toast보다 사용자가 읽기 좋음)
          setServerError(err.message);
        } else {
          toast.show({
            message: "초대 발송에 실패했어요. 잠시 후 다시 시도해주세요",
            variant: "error",
          });
        }
      }
    },
    [createMutation, toast, navigation],
  );

  const canSubmit = isValid && !createMutation.isPending;

  return (
    <ScreenContainer audience="guardian" paddingTop={0}>
      <AppHeader title="피보호자 초대" audience="guardian" />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        bottomOffset={Spacing.lg}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <AppText variant="bodyBold" audience="guardian">
            모니터링하실 어르신의 정보를 입력해주세요
          </AppText>
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            style={styles.introDesc}
          >
            어르신이 앱을 설치하고 회원가입을 마친 상태여야 해요. 보내는 즉시
            어르신의 휴대폰으로 안내 문자가 발송됩니다.
          </AppText>
        </View>

        <View style={styles.fields}>
          <Controller
            control={control}
            name="wardPhone"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <AppTextInput
                label="어르신 휴대폰 번호"
                placeholder="010-0000-0000"
                value={value ?? ""}
                onChangeText={(t) => {
                  onChange(formatPhone(t));
                  if (serverError) setServerError(null);
                }}
                onBlur={onBlur}
                keyboardType="number-pad"
                maxLength={13}
                error={error?.message}
                autoFocus
                audience="guardian"
              />
            )}
          />

          <Controller
            control={control}
            name="relationship"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <AppTextInput
                label="관계 (선택)"
                placeholder="어머니, 아버지 등"
                value={value ?? ""}
                onChangeText={(t) => {
                  onChange(t);
                  if (serverError) setServerError(null);
                }}
                onBlur={onBlur}
                maxLength={20}
                error={error?.message}
                audience="guardian"
              />
            )}
          />

          {serverError ? (
            <View style={styles.errorBox}>
              <AppText variant="caption" audience="guardian" color="danger">
                {serverError}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={createMutation.isPending ? "보내는 중..." : "초대 보내기"}
            onPress={handleSubmit(onSubmit)}
            disabled={!canSubmit || wardPhone.length < 13}
            audience="guardian"
          />
        </View>
      </KeyboardAwareScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    justifyContent: "space-between",
  },
  intro: {
    marginBottom: Spacing.xl,
  },
  introDesc: {
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  fields: {
    gap: Spacing.lg,
    flex: 1,
  },
  errorBox: {
    backgroundColor: Colors.surface.background,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.semantic.danger,
  },
  footer: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
});
