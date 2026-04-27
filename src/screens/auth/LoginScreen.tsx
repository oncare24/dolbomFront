import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
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
import { login } from "../../services/authService";
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
  const [showPassword, setShowPassword] = useState(false);
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
    } else if (password.length < 4) {
      setPasswordError("비밀번호는 4자 이상이어야 합니다");
      valid = false;
    }

    return valid;
  }

  async function handleLogin() {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await login({ phoneNumber, password });
      setLogin(response.accessToken, response.user);
    } catch (error: any) {
      Alert.alert("로그인 실패", error.message ?? "다시 시도해주세요");
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

        <View>
          <AppTextInput
            label="비밀번호"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (passwordError) setPasswordError("");
            }}
            placeholder="비밀번호 입력"
            secureTextEntry={!showPassword}
            error={passwordError}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.showPasswordButton}
            hitSlop={12}
          >
            <AppText variant="caption" color="link">
              {showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            </AppText>
          </Pressable>
        </View>

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
          처음이세요?
          <AppText variant="bodyBold" color="link">
            회원가입
          </AppText>
        </AppText>
      </Pressable>

      <View style={styles.devHint}>
        <AppText variant="caption" color="secondary">
          테스트 계정 (개발용)
        </AppText>
        <AppText variant="caption" color="secondary">
          피보호자: 010-1111-1111 / 1111
        </AppText>
        <AppText variant="caption" color="secondary">
          보호자: 010-2222-2222 / 2222
        </AppText>
      </View>
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
  showPasswordButton: {
    alignSelf: "flex-end",
    marginTop: Spacing.xs, // 8dp
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  loadingOverlay: {
    position: "absolute",
    bottom: 22, // 버튼 정중앙
    alignSelf: "center",
  },
  signupLink: {
    alignSelf: "center",
    marginTop: Spacing.xl, // 32dp
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  devHint: {
    marginTop: Spacing.xxl,
    padding: Spacing.md,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    gap: 4,
  },
});
