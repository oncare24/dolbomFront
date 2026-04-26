import React from "react";
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { AppText } from "../Text";
import { Colors, Spacing, Radius } from "../../../theme";
import { haptic } from "../../../utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: "elderly" | "guardian";
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  size = "elderly",
  style,
}: PrimaryButtonProps) {
  const isInactive = loading || disabled;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isInactive) return;
    scale.value = withTiming(0.97, {
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
      disabled={isInactive}
      android_ripple={{ color: Colors.brand.primaryDark, borderless: false }}
      style={[
        styles.base,
        size === "elderly" ? styles.sizeElderly : styles.sizeGuardian,
        isInactive && styles.inactive,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.text.inverse} />
      ) : (
        <AppText
          variant="bodyBold"
          color="inverse"
          maxScale={1.3}
          numberOfLines={1}
        >
          {label}
        </AppText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    overflow: "hidden",
  },
  sizeElderly: { minHeight: 72 },
  sizeGuardian: { minHeight: 56 },
  inactive: { opacity: 0.5 },
});
