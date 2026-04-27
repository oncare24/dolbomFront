// 회원가입 Step 4: 완료 화면.
// 자동 로그인까지 처리하고, 가운데 체크마크 + 안내 + 시작 버튼.

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../common/Text";
import { PrimaryButton } from "../common/Button";

import { Colors, Spacing } from "../../theme";

interface Props {
  userName: string;
  onStart: () => void;
}

export function SignupStepDone({ userName, onStart }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>
        <AppText variant="h2" color="primary" style={styles.greeting}>
          {userName}님, 환영해요
        </AppText>
        <AppText variant="body" color="secondary" style={styles.desc}>
          지금부터 보살핌을 사용할 수 있어요
        </AppText>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="시작하기" onPress={onStart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  greeting: {
    marginBottom: Spacing.sm,
  },
  desc: {
    textAlign: "center",
    lineHeight: 24,
  },
  actions: {
    paddingBottom: Spacing.xl,
  },
});
