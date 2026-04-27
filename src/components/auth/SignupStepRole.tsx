// Step 1: 역할 선택 (피보호자 / 보호자)
// 시니어 UX: 큰 카드, 아이콘+텍스트 병기, 선택 시 시각적 피드백 명확.
// 선택하면 자동으로 다음 단계로 이동 (별도 "다음" 버튼 없음 — 탭 횟수 최소화).

import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFormContext } from "react-hook-form";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { AppText } from "../common/Text";
import { Colors, Spacing, Radius, Touch, Elevation } from "../../theme";
import { haptic } from "../../utils/haptics";
import type { SignupFormValues, UserRole } from "../../schemas/signupSchema";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  onNext: () => void;
}

interface RoleOption {
  value: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const OPTIONS: RoleOption[] = [
  {
    value: "elderly",
    title: "어르신",
    description: "도움을 받고 싶어요",
    icon: "person-outline",
  },
  {
    value: "guardian",
    title: "가족·보호자",
    description: "어르신을 보살펴드려요",
    icon: "people-outline",
  },
];

export function SignupStepRole({ onNext }: Props) {
  const { setValue, watch } = useFormContext<SignupFormValues>();
  const selectedRole = watch("role");

  const handleSelect = (role: UserRole) => {
    haptic.light();
    setValue("role", role, { shouldValidate: true });
    // 약간의 딜레이로 선택 애니메이션 보여주고 넘어감
    setTimeout(() => onNext(), 200);
  };

  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => (
        <RoleCard
          key={option.value}
          option={option}
          selected={selectedRole === option.value}
          onPress={() => handleSelect(option.value)}
        />
      ))}
    </View>
  );
}

interface RoleCardProps {
  option: RoleOption;
  selected: boolean;
  onPress: () => void;
}

function RoleCard({ option, selected, onPress }: RoleCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, {
      duration: 120,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: Colors.brand.primaryLight, borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={`${option.title}, ${option.description}`}
      accessibilityState={{ selected }}
      style={[styles.card, selected && styles.cardSelected, animatedStyle]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={option.icon}
          size={40}
          color={selected ? Colors.text.inverse : Colors.brand.primary}
        />
      </View>
      <View style={styles.textWrap}>
        <AppText variant="h2" color="primary">
          {option.title}
        </AppText>
        <AppText variant="body" color="secondary" style={styles.desc}>
          {option.description}
        </AppText>
      </View>
      {selected && (
        <View style={styles.checkWrap}>
          <Ionicons
            name="checkmark-circle"
            size={28}
            color={Colors.brand.primary}
          />
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    minHeight: Touch.senior + 48,
    borderWidth: 2,
    borderColor: Colors.surface.divider,
    ...Elevation.xs,
  },
  cardSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primaryLight,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  iconWrapSelected: {
    backgroundColor: Colors.brand.primary,
  },
  textWrap: {
    flex: 1,
  },
  desc: {
    marginTop: 2,
  },
  checkWrap: {
    marginLeft: Spacing.sm,
  },
});
