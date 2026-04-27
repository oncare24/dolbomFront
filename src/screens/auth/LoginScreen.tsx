import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppText } from "../../components/common/Text";
import { AppTextInput } from "../../components/common/Input";
import { PrimaryButton } from "../../components/common/Button";
import { ScreenContainer } from "../../components/common/Layout";

import { Colors } from "../../theme/colors";
import { Spacing } from "../../theme/spacing";

import { useAuthStore } from "../../stores/authStore";
import { login as loginApi } from "../../services/authService";
import { getMe } from "../../services/userService";
import { ApiException } from "../../services/api";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "Login">;

function formatPhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const setLogin = useAuthStore((s) => s.login);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    let valid = true;
    setPhoneError("");
    setPasswordError("");

    if (phoneNumber.length === 0) {
      setPhoneError("휴대폰 번호를 입력해주세요");
      valid = false;
    } else if (phoneNumber.replace(/\D/g, "").length !== 11) {
      setPhoneError("휴대폰 번호 11자리를 모두 입력해주세요");
      valid = false;
    }

    if (password.length === 0) {
      setPasswordError("비밀번호를 입력해주세요");
      valid = false;
    } else if (!/^\d{6}$/.test(password)) {
      setPasswordError("비밀번호는 숫자 6자리예요");
      valid = false;
    }

    return valid;
  }

  async function handleLogin() {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const tokens = await loginApi({ phone: phoneNumber, password });
      // 토큰만 먼저 저장 (다음 getMe 호출 시 헤더에 부착됨)
      setLogin(tokens.accessToken, tokens.refreshToken, {
        id: 0,
        name: "",
        phoneNumber,
        role: "elderly",
      });
      // 진짜 user 정보로 갱신
      const me = await getMe();
      setLogin(tokens.accessToken, tokens.refreshToken, me);
      // App.tsx 라우팅이 자동으로 홈으로 분기
    } catch (e) {
      // 4xx만 Alert, 5xx/네트워크 끊김/타임아웃은 인터셉터의 Toast에 맡김
      if (
        e instanceof ApiException &&
        e.status &&
        e.status >= 400 &&
        e.status < 500
      ) {
        Alert.alert("로그인 실패", e.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <AppText variant="h1" color="primary" style={styles.title}>
          보살핌
        </AppText>
        <AppText variant="body" color="secondary">
          휴대폰 번호로 로그인해주세요
        </AppText>
      </View>

      <View style={styles.form}>
        <AppTextInput
          label="휴대폰 번호"
          value={phoneNumber}
          onChangeText={(t) => {
            setPhoneNumber(formatPhoneNumber(t));
            if (phoneError) setPhoneError("");
          }}
          placeholder="010-0000-0000"
          keyboardType="phone-pad"
          maxLength={13}
          error={phoneError}
        />

        <AppTextInput
          label="비밀번호"
          value={password}
          onChangeText={(t) => {
            setPassword(t.replace(/\D/g, "").slice(0, 6));
            if (passwordError) setPasswordError("");
          }}
          placeholder="숫자 6자리"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          error={passwordError}
        />

        <PrimaryButton
          label={isLoading ? "" : "로그인"}
          onPress={handleLogin}
          disabled={isLoading}
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.text.inverse} />
          </View>
        )}
      </View>

      <Pressable
        onPress={() => navigation.navigate("Signup")}
        style={styles.signupLink}
        hitSlop={12}
      >
        <AppText variant="body" color="secondary">
          처음이세요?{" "}
          <AppText variant="bodyBold" color="link">
            회원가입
          </AppText>
        </AppText>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  form: {
    gap: Spacing.md,
  },
  loadingOverlay: {
    position: "absolute",
    bottom: 22,
    alignSelf: "center",
  },
  signupLink: {
    alignSelf: "center",
    marginTop: Spacing.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
});
