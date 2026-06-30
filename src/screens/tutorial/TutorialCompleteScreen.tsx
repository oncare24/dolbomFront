// [튜토리얼] 완료 화면.
// 약 챙기기 튜토리얼 마지막 단계 후 진입.
// "시작하기" 누르면 실제 ElderlyHome으로 popToTop.

import React from "react";
import { StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../../components/common/Text";
import { Colors, Radius, Spacing, Touch } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "TutorialComplete">;

export default function TutorialCompleteScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const featureLabel = "약 챙기기";

  const handleStart = () => {
    // 튜토리얼 스택 전부 pop → 첫 화면(ElderlyHome)으로
    navigation.popToTop();
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={80} color={Colors.text.inverse} />
        </View>

        <AppText
          variant="display"
          audience="elderly"
          color="primary"
          style={styles.title}
        >
          수고하셨어요!
        </AppText>

        <AppText
          variant="body"
          audience="elderly"
          color="secondary"
          style={styles.description}
        >
          ‘{featureLabel}’ 사용법을{"\n"}
          모두 익히셨어요.{"\n\n"}
          이제 실제로 한번 사용해 볼까요?
        </AppText>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleStart}
          style={styles.startBtn}
          activeOpacity={0.85}
        >
          <AppText
            variant="bodyBold"
            audience="elderly"
            style={styles.startBtnText}
          >
            시작해볼까요?
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.semantic.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    shadowColor: Colors.semantic.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign: "center",
    lineHeight: 32,
  },
  buttonContainer: {
    paddingBottom: Spacing.xl,
  },
  startBtn: {
    minHeight: Touch.senior,
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  startBtnText: {
    color: Colors.text.inverse,
  },
});
