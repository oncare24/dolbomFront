import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, BackHandler } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { SignupProgress } from "../../components/auth/SignupProgress";
import { SignupStepRole } from "../../components/auth/SignupStepRole";
import { SignupStepProfile } from "../../components/auth/SignupStepProfile";
import { signupSchema, SignupFormValues } from "../../schemas/signupSchema";
import { Spacing } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";

type Step = 1 | 2 | 3 | 4;
const TOTAL_INPUT_STEPS = 3;

const STEP_TITLES: Record<Step, string> = {
  1: "어떤 분이신가요?",
  2: "연락처를 알려주세요",
  3: "비밀번호를 정해주세요",
  4: "가입이 완료되었어요",
};

type Nav = NativeStackNavigationProp<RootStackParamList, "Signup">;

export default function SignupScreen() {
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState<Step>(1);

  const methods = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      role: undefined as unknown as SignupFormValues["role"],
      phone: "",
      name: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const goNext = useCallback(() => {
    setStep((s) => Math.min(4, s + 1) as Step);
  }, []);

  const goBack = useCallback(() => {
    if (step === 1) {
      navigation.goBack();
      return;
    }
    if (step === 4) return; // 완료 화면 차단
    setStep((s) => Math.max(1, s - 1) as Step);
  }, [step, navigation]);

  // 안드로이드 하드웨어 뒤로가기
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (step === 4) return true;
      if (step > 1) {
        setStep((s) => (s - 1) as Step);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  return (
    <ScreenContainer audience="elderly" scrollable={false}>
      <AppHeader title="회원가입" showBack={step !== 4} onBackPress={goBack} />

      {step !== 4 && (
        <SignupProgress currentStep={step} totalSteps={TOTAL_INPUT_STEPS} />
      )}

      <View style={styles.titleWrap}>
        <AppText variant="h1" color="primary">
          {STEP_TITLES[step]}
        </AppText>
      </View>

      <FormProvider {...methods}>
        <View style={styles.stepWrap}>
          {step === 1 && <SignupStepRole onNext={goNext} />}
          {step === 2 && <SignupStepProfile onNext={goNext} />}
          {step === 3 && <AppText variant="body" color="secondary"></AppText>}
          {step === 4 && <AppText variant="body" color="secondary"></AppText>}
        </View>
      </FormProvider>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  stepWrap: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
});
