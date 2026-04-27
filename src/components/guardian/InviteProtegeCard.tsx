// 피보호자 초대 카드 (점선 테두리, 리스트 끝).

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
import { Colors, Spacing, Radius } from "../../theme";
import { haptic } from "../../utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  onPress: () => void;
}

export function InviteProtegeCard({ onPress }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, {
      duration: 120,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
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
      android_ripple={{ color: Colors.brand.primaryLight, borderless: false }}
      accessibilityRole="button"
      accessibilityLabel="피보호자 초대"
      style={[styles.card, animatedStyle]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="add" size={28} color={Colors.brand.primary} />
      </View>
      <View style={styles.textWrap}>
        <AppText variant="bodyBold" audience="guardian" color="link">
          피보호자 초대
        </AppText>
        <AppText
          variant="caption"
          audience="guardian"
          color="secondary"
          style={styles.desc}
        >
          문자로 초대 링크 보내기
        </AppText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.background,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.brand.primary,
    overflow: "hidden",
    minHeight: 80,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  desc: {
    marginTop: 2,
  },
});
