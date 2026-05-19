// 피보호자 설정 화면.
// 현재 항목: 사용법 다시 배우기 (튜토리얼 진입)
// 추후 추가 예정: 글자 크기, 음성 안내, 알림 등

import React from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { Colors, Radius, Spacing, Touch } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "ElderlySettings">;

export default function ElderlySettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const handleStartTutorial = () => {
    navigation.navigate("TutorialHome");
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />

      <View style={{ paddingTop: insets.top }}>
        <AppHeader title="설정" audience="elderly" />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        {/* ─── 사용 도움말 섹션 ─── */}
        <AppText
          variant="caption"
          audience="elderly"
          color="secondary"
          style={styles.sectionTitle}
        >
          사용 도움말
        </AppText>

        <Pressable
          onPress={handleStartTutorial}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          android_ripple={{ color: Colors.surface.divider }}
        >
          <View style={[styles.iconWrap, styles.iconBlue]}>
            <Ionicons
              name="book-outline"
              size={28}
              color={Colors.brand.primary}
            />
          </View>
          <View style={styles.rowText}>
            <AppText variant="bodyBold" audience="elderly" color="primary">
              사용법 다시 배우기
            </AppText>
            <AppText variant="caption" audience="elderly" color="secondary">
              병원 찾기 연습을 다시 해볼 수 있어요
            </AppText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={Colors.text.disabled}
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: Touch.comfortable,
    gap: Spacing.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBlue: {
    backgroundColor: Colors.brand.primaryLight,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
});
