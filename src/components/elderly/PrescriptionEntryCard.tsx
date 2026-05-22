// 처방받은 약 목록 진입 카드.
// 분석 결과 화면 → 처방 약 목록 화면(별도)으로 이동.
// 펼치기 안티패턴 대신 명확한 다음 화면 진입점.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";

import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  count: number;
  onPress: () => void;
}

export function PrescriptionEntryCard({ count, onPress }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    haptic.light();
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: Colors.gray[100], borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={`처방받은 약 ${count}종 보기`}
      accessibilityHint="복용법 자세히 보기 화면으로 이동"
      style={[styles.card, animatedStyle]}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name="medkit-outline"
          size={22}
          color={Colors.semantic.info}
        />
      </View>
      <View style={styles.text}>
        <AppText variant="bodyBold" audience="elderly">
          처방받은 약 보기
        </AppText>
        <AppText
          variant="caption"
          audience="elderly"
          color="secondary"
          style={styles.sub}
        >
          총 {count}종 · 복용법 자세히
        </AppText>
      </View>
      <Ionicons
        name="chevron-forward"
        size={22}
        color={Colors.text.secondary}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Elevation.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.semantic.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
  },
  sub: {
    marginTop: 2,
  },
});
