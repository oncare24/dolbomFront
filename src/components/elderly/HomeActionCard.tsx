// 피보호자 홈 메인 액션 카드.
// layout='vertical': 정사각형 (일반 액션)
// layout='horizontal': 가로형 (강조 액션 - SOS)
// variant='danger': 빨간 배경 (SOS)

import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { AppText } from "../common/Text";
import { Colors, Spacing, Radius, Elevation } from "../../theme";
import { haptic } from "../../utils/haptics";
import type { IoniconName } from "../../types/elderlyHome";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = "default" | "danger";
type CardLayout = "vertical" | "horizontal";

interface Props {
  icon: IoniconName;
  title: string;
  description?: string;
  onPress: () => void;
  variant?: CardVariant;
  layout?: CardLayout;
  /** 외부에서 카드 스타일 override (예: 튜토리얼 강조 테두리) */
  style?: StyleProp<ViewStyle>;
}

export function HomeActionCard({
  icon,
  title,
  description,
  onPress,
  variant = "default",
  layout = "vertical",
  style,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, {
      duration: 120,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
  };

  const handlePress = () => {
    haptic.medium();
    onPress();
  };

  const isDanger = variant === "danger";
  const isHorizontal = layout === "horizontal";

  const cardBg = isDanger ? Colors.semantic.danger : Colors.surface.card;
  const iconBg = isDanger
    ? "rgba(255,255,255,0.18)"
    : Colors.brand.primaryLight;
  const iconColor = isDanger ? Colors.text.inverse : Colors.brand.primary;
  const titleColor = isDanger ? "inverse" : "primary";
  const descColor = isDanger ? "inverse" : "secondary";
  const rippleColor = isDanger ? "rgba(255,255,255,0.2)" : Colors.gray[200];

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: rippleColor, borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}, ${description}` : title}
      style={[
        styles.cardBase,
        isHorizontal ? styles.cardHorizontal : styles.cardVertical,
        { backgroundColor: cardBg },
        animatedStyle,
        style, // 외부 override (튜토리얼 강조 등)
      ]}
    >
      <View
        style={[
          isHorizontal ? styles.iconWrapHorizontal : styles.iconWrapVertical,
          { backgroundColor: iconBg },
        ]}
      >
        <Ionicons name={icon} size={isHorizontal ? 40 : 36} color={iconColor} />
      </View>

      <View
        style={
          isHorizontal ? styles.textWrapHorizontal : styles.textWrapVertical
        }
      >
        <AppText
          variant="h3"
          color={titleColor}
          style={{
            textAlign: isHorizontal ? "left" : "center",
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {title}
        </AppText>

        {description && (
          <AppText
            variant="caption"
            color={descColor}
            style={{ textAlign: isHorizontal ? "left" : "center" }}
            numberOfLines={2}
          >
            {description}
          </AppText>
        )}
      </View>

      {isHorizontal && (
        <Ionicons
          name="chevron-forward"
          size={24}
          color={isDanger ? Colors.text.inverse : Colors.text.disabled}
          style={styles.chevron}
        />
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    borderRadius: Radius.xl,
    overflow: "hidden",
    ...Elevation.md,
  },
  cardVertical: {
    flex: 1,
    aspectRatio: 1,
    padding: Spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  cardHorizontal: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    minHeight: 96,
  },
  iconWrapVertical: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  iconWrapHorizontal: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textWrapVertical: {
    alignItems: "center",
  },
  textWrapHorizontal: {
    flex: 1,
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
});
