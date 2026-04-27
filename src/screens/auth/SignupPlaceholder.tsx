import React from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppText } from "../../components/common/Text";
import { SecondaryButton } from "../../components/common/Button";
import { ScreenContainer } from "../../components/common/Layout";
import { Spacing } from "../../theme/spacing";

export default function SignupPlaceholder() {
  const navigation = useNavigation();

  return (
    <ScreenContainer>
      <View style={styles.center}>
        <AppText variant="h2" color="primary" style={styles.title}>
          회원가입 화면
        </AppText>
        <AppText variant="body" color="secondary" style={styles.desc}>
          다음 작업에서 구현 예정
        </AppText>
        <SecondaryButton
          label="로그인으로 돌아가기"
          onPress={() => navigation.goBack()}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.md,
  },
  title: {
    textAlign: "center",
  },
  desc: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
});
