import React from "react";
import { Text as RNText, TextProps, TextStyle, StyleProp } from "react-native";
import {
  Colors,
  Typography,
  TypographyVariant,
  TypographyAudience,
} from "../../../theme";

// color prop 확장: text 토큰 + 'danger' (에러 메시지용, semantic.danger 매핑)
type TextColorVariant = keyof typeof Colors.text | "danger";

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  audience?: TypographyAudience;
  color?: TextColorVariant;
  maxScale?: number;
  style?: StyleProp<TextStyle>;
}

// color → 실제 hex 매핑
function resolveColor(color: TextColorVariant): string {
  if (color === "danger") return Colors.semantic.danger;
  return Colors.text[color];
}

export function AppText({
  variant = "body",
  audience = "elderly",
  color = "primary",
  maxScale = 1.5,
  style,
  children,
  ...rest
}: AppTextProps) {
  const baseStyle: TextStyle = {
    ...Typography[audience][variant],
    color: resolveColor(color),
  };

  return (
    <RNText
      allowFontScaling
      maxFontSizeMultiplier={maxScale}
      style={[baseStyle, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
