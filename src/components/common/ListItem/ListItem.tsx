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
  Easing,
} from "react-native-reanimated";
import { AppText } from "../Text";
import { Colors, Spacing, Touch } from "../../../theme";
import { haptic } from "../../../utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  leftIconColor?: string;
  rightElement?: React.ReactNode; // 토글, 뱃지 등 자유 영역
  showChevron?: boolean; // 우측 화살표 (default: onPress 있으면 true)
  onPress?: () => void;
  audience?: "elderly" | "guardian";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

/**
 * ListItem
 * - 설정/홈/리스트 화면용 표준 행 컴포넌트.
 * - 좌측 아이콘 + 본문(title/subtitle) + 우측 영역(rightElement or chevron).
 * - audience='elderly' 기본 — 행 높이 72dp(Touch.senior).
 */
export function ListItem({
  title,
  subtitle,
  leftIcon,
  leftIconColor,
  rightElement,
  showChevron,
  onPress,
  audience = "elderly",
  disabled = false,
  style,
  accessibilityHint,
}: ListItemProps) {
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (!onPress || disabled) return;
    opacity.value = withTiming(0.6, {
      duration: 100,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePressOut = () => {
    opacity.value = withTiming(1, { duration: 150 });
  };

  const handlePress = () => {
    haptic.light();
    onPress?.();
  };

  const minHeight = audience === "elderly" ? Touch.senior : Touch.comfortable;
  const iconSize = audience === "elderly" ? 28 : 24;
  const showChevronFinal = showChevron ?? (onPress != null && !rightElement);

  const content = (
    <View style={[styles.row, { minHeight }]}>
      {leftIcon && (
        <View style={styles.leftIconWrap}>
          <Ionicons
            name={leftIcon}
            size={iconSize}
            color={leftIconColor ?? Colors.brand.primary}
          />
        </View>
      )}

      <View style={styles.textWrap}>
        <AppText
          variant={audience === "elderly" ? "bodyBold" : "body"}
          audience={audience}
          color="primary"
          numberOfLines={1}
        >
          {title}
        </AppText>
        {subtitle && (
          <AppText
            variant="caption"
            audience={audience}
            color="secondary"
            numberOfLines={2}
            style={styles.subtitle}
          >
            {subtitle}
          </AppText>
        )}
      </View>

      {rightElement && <View style={styles.rightWrap}>{rightElement}</View>}

      {showChevronFinal && (
        <Ionicons
          name="chevron-forward"
          size={iconSize - 4}
          color={Colors.text.disabled}
          style={styles.chevron}
        />
      )}
    </View>
  );

  if (!onPress) {
    return (
      <View style={[styles.base, disabled && styles.disabled, style]}>
        {content}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      android_ripple={{ color: Colors.gray[100] }}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[styles.base, disabled && styles.disabled, animatedStyle, style]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface.card,
    paddingHorizontal: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  leftIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
    justifyContent: "center",
  },
  subtitle: {
    marginTop: 2,
  },
  rightWrap: {
    marginLeft: Spacing.sm,
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
