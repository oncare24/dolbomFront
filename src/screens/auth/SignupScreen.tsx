import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, BackHandler, Alert } from "react-native";
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
import { SignupStepPassword } from "../../components/auth/SignupStepPassword";
import { SignupStepDone } from "../../components/auth/SignupStepDone";
import { signupSchema, SignupFormValues } from "../../schemas/signupSchema";
import { Spacing } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";
import { signup, login as loginApi } from "../../services/authService";
import { getMe } from "../../services/userService";
import { ApiException } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";

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
  const setLogin = useAuthStore((s) => s.login);

  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Step 3 "다음" → 백엔드 signup → 성공 시 step 4
  const handlePasswordNext = useCallback(async () => {
    const values = methods.getValues();
    setIsSubmitting(true);
    try {
      await signup({
        phone: values.phone,
        password: values.password,
        name: values.name,
        role: values.role,
      });
      setStep(4);
    } catch (e) {
      if (
        e instanceof ApiException &&
        e.status &&
        e.status >= 400 &&
        e.status < 500
      ) {
        Alert.alert("회원가입 실패", e.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [methods]);

  // Step 4 "시작하기" → 자동 로그인 → 홈 진입
  const handleStart = useCallback(async () => {
    const values = methods.getValues();
    try {
      const tokens = await loginApi({
        phone: values.phone,
        password: values.password,
      });
      // 토큰 먼저 store에 저장(다음 getMe 요청에서 헤더에 부착되도록)
      setLogin(tokens.accessToken, tokens.refreshToken, {
        id: 0,
        name: values.name,
        phoneNumber: values.phone,
        role: values.role,
      });
      // 정확한 user 정보로 갱신
      const me = await getMe();
      setLogin(tokens.accessToken, tokens.refreshToken, me);
      // App.tsx의 라우팅이 자동으로 홈으로 보내줌
    } catch (e) {
      if (
        e instanceof ApiException &&
        e.status &&
        e.status >= 400 &&
        e.status < 500
      ) {
        Alert.alert("로그인 실패", e.message);
      }
      navigation.replace("Login");
    }
  }, [methods, setLogin, navigation]);

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
          {step === 3 && (
            <SignupStepPassword
              onNext={handlePasswordNext}
              isSubmitting={isSubmitting}
            />
          )}
          {step === 4 && (
            <SignupStepDone
              userName={methods.getValues().name || ""}
              onStart={handleStart}
            />
          )}
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
