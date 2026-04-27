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

type ButtonAudience = "elderly" | "guardian";

interface DangerButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: ButtonAudience;
  audience?: ButtonAudience;
  style?: StyleProp<ViewStyle>;
}

export function DangerButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  size,
  audience,
  style,
}: DangerButtonProps) {
  const variant = audience ?? size ?? "elderly";

  const isInactive = loading || disabled;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isInactive) return;
    scale.value = withTiming(0.95, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  };

  const handlePress = () => {
    haptic.heavy();
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isInactive}
      android_ripple={{ color: "#8E1212", borderless: false }}
      style={[
        styles.base,
        variant === "elderly" ? styles.sizeElderly : styles.sizeGuardian,
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
    backgroundColor: Colors.semantic.danger,
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
