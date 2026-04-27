import React from "react";
import { View, StyleSheet } from "react-native";

import { AppText } from "../../components/common/Text";
import { DangerButton } from "../../components/common/Button";
import { ScreenContainer } from "../../components/common/Layout";
import { Spacing } from "../../theme/spacing";

import { useAuthStore } from "../../stores/authStore";
import { logout as logoutApi } from "../../services/authService";

export default function ElderlyHomePlaceholder() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logoutApi();
    logout();
  }

  return (
    <ScreenContainer>
      <View style={styles.center}>
        <AppText variant="h1" color="primary" style={styles.title}>
          {user?.name}님
        </AppText>
        <AppText variant="body" color="secondary" style={styles.desc}>
          피보호자 메인 화면 (구현 예정)
        </AppText>
        <AppText variant="caption" color="secondary" style={styles.role}>
          역할: 피보호자 (elderly)
        </AppText>

        <View style={styles.spacer} />

        <DangerButton label="로그아웃" onPress={handleLogout} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    paddingTop: Spacing.xxl,
  },
  title: {
    textAlign: "center",
  },
  desc: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  role: {
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  spacer: {
    flex: 1,
  },
});
