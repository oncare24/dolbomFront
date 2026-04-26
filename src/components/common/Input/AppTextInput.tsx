import React, { useEffect } from "react";
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  KeyboardTypeOptions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { Colors } from "../../../theme/colors";
import { Spacing, Radius } from "../../../theme/spacing";
import { Typography } from "../../../theme/typography";
import { AppText } from "../Text/AppText";

type Audience = "elderly" | "guardian";

interface AppTextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  maxLength?: number;
  audience?: Audience;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  editable?: boolean;
}

/**
 * AppTextInput
 * - 시니어 친화 입력 필드 (높이 64dp, 본문 18sp, AAA 대비)
 * - 포커스 시 테두리 색 부드럽게 전환 (200ms, Material standard easing)
 * - 에러 시 좌우 흔들림 애니메이션 (Apple HIG 표준 패턴)
 * - audience='elderly' 기본값 (피보호자 화면 우선)
 */
export const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  keyboardType = "default",
  secureTextEntry = false,
  maxLength,
  audience = "elderly",
  autoCapitalize = "none",
  editable = true,
}) => {
  // 0 = 평소, 1 = 포커스
  const focusProgress = useSharedValue(0);
  // 에러 흔들림 offset
  const shakeX = useSharedValue(0);

  const handleFocus = () => {
    focusProgress.value = withTiming(1, {
      duration: 200,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    });
  };

  const handleBlur = () => {
    focusProgress.value = withTiming(0, {
      duration: 200,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    });
  };

  // 에러가 새로 들어오면 흔들림 트리거
  useEffect(() => {
    if (error) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [error]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? Colors.semantic.danger
      : interpolateColor(
          focusProgress.value,
          [0, 1],
          [Colors.gray[300], Colors.brand.primary],
        );

    return {
      borderColor,
      borderWidth: focusProgress.value > 0.5 || !!error ? 2 : 1.5,
      transform: [{ translateX: shakeX.value }],
    };
  });

  const typography =
    audience === "elderly" ? Typography.elderly : Typography.guardian;

  return (
    <View style={styles.wrapper}>
      {label && (
        <AppText
          variant="caption"
          audience={audience}
          color="primary"
          style={styles.label}
        >
          {label}
        </AppText>
      )}

      <Animated.View style={[styles.inputContainer, animatedContainerStyle]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.disabled}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            {
              fontSize: typography.body.fontSize,
              lineHeight: typography.body.lineHeight,
              color: editable ? Colors.text.primary : Colors.text.disabled,
            },
          ]}
          allowFontScaling
          maxFontSizeMultiplier={1.5}
          underlineColorAndroid="transparent"
          selectionColor={Colors.brand.primary}
        />
      </Animated.View>

      {(error || helperText) && (
        <AppText
          variant="caption"
          audience={audience}
          color={error ? "danger" : "secondary"}
          style={styles.helper}
        >
          {error || helperText}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  label: {
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface.background,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  helper: {
    marginTop: Spacing.xs,
  },
});
