import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, BackHandler, Alert } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { SignupProgress } from "../../components/auth/SignupProgress";
import { SignupStepRole } from "../../components/auth/SignupStepRole";
import { SignupStepProfile } from "../../components/auth/SignupStepProfile";
import { SignupStepPassword } from "../../components/auth/SignupStepPassword";
import { SignupStepDone } from "../../components/auth/SignupStepDone";
import { signupSchema, SignupFormValues } from "../../schemas/signupSchema";
import { Colors, Spacing } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";
import { signup, login as loginApi } from "../../services/authService";
import { getMe } from "../../services/userService";
import { ApiException } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";

type Step = 1 | 2 | 3 | 4;
const TOTAL_INPUT_STEPS = 3;

const STEP_TITLES: Record<Step, string> = {
  1: "어떤 분이신가요?",
  2: "기본 정보를 알려주세요",
  3: "비밀번호를 정해주세요",
  4: "가입이 완료되었어요",
};

type Nav = NativeStackNavigationProp<RootStackParamList, "Signup">;

export default function SignupScreen() {
  const navigation = useNavigation<Nav>();
  const setLogin = useAuthStore((s) => s.login);
  const insets = useSafeAreaInsets();

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
      age: "",
      isPregnant: undefined,
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
    if (step === 4) return;
    setStep((s) => Math.max(1, s - 1) as Step);
  }, [step, navigation]);

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

  const handlePasswordNext = useCallback(async () => {
    const values = methods.getValues();
    setIsSubmitting(true);
    try {
      await signup({
        phone: values.phone,
        password: values.password,
        name: values.name,
        role: values.role,
        age:
          values.role === "elderly" && values.age
            ? Number(values.age)
            : undefined,
        isPregnant: values.role === "elderly" ? values.isPregnant : undefined,
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

  const handleStart = useCallback(async () => {
    const values = methods.getValues();
    try {
      const tokens = await loginApi({
        phone: values.phone,
        password: values.password,
      });
      setLogin(tokens.accessToken, tokens.refreshToken, {
        id: 0,
        name: values.name,
        phoneNumber: values.phone,
        role: values.role,
      });
      const me = await getMe();
      setLogin(tokens.accessToken, tokens.refreshToken, me);
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
    <View style={styles.root}>
      <AppHeader title="회원가입" showBack={step !== 4} onBackPress={goBack} />

      {step !== 4 && (
        <SignupProgress currentStep={step} totalSteps={TOTAL_INPUT_STEPS} />
      )}

      <FormProvider {...methods}>
        <KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Spacing.xxl + insets.bottom },
          ]}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          bottomOffset={Spacing.lg}
        >
          <AppText variant="h1" color="primary" style={styles.title}>
            {STEP_TITLES[step]}
          </AppText>

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
        </KeyboardAwareScrollView>
      </FormProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  title: {
    marginBottom: Spacing.lg,
  },
});
