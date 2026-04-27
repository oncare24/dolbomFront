// + 안전구역 추가 점선 카드. 5개 꽉 차면 비활성.

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
  disabled?: boolean;
}

export function AddSafetyZoneCard({ onPress, disabled = false }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withTiming(0.98, {
      duration: 120,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
  };

  const handlePress = () => {
    if (disabled) return;
    haptic.light();
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      android_ripple={
        disabled ? undefined : { color: Colors.brand.primaryLight }
      }
      accessibilityRole="button"
      accessibilityLabel={
        disabled ? "안전구역 최대 5개 등록 완료" : "안전구역 추가"
      }
      accessibilityState={{ disabled }}
      style={[
        styles.card,
        disabled ? styles.disabled : styles.enabled,
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: disabled
              ? Colors.gray[100]
              : Colors.brand.primaryLight,
          },
        ]}
      >
        <Ionicons
          name="add"
          size={24}
          color={disabled ? Colors.gray[500] : Colors.brand.primary}
        />
      </View>
      <View style={styles.textWrap}>
        <AppText
          variant="bodyBold"
          audience="guardian"
          color={disabled ? "disabled" : "link"}
        >
          {disabled ? "안전구역 5개 등록 완료" : "안전구역 추가"}
        </AppText>
        <AppText
          variant="caption"
          audience="guardian"
          color="secondary"
          style={styles.desc}
        >
          {disabled
            ? "기존 안전구역을 수정해주세요"
            : "지도에서 위치를 선택하세요"}
        </AppText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    overflow: "hidden",
    minHeight: 76,
  },
  enabled: {
    backgroundColor: Colors.surface.background,
    borderColor: Colors.brand.primary,
  },
  disabled: {
    backgroundColor: Colors.gray[50],
    borderColor: Colors.gray[300],
    opacity: 0.7,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
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
