import React from "react";
import { View, ScrollView, ViewStyle, StyleProp } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, ScreenPadding } from "../../../theme";

interface ScreenContainerProps {
  children: React.ReactNode;
  audience?: "elderly" | "guardian";
  scrollable?: boolean;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
  /** 상단 패딩 override. ScreenPadding[audience].vertical 대신 이 값 사용. */
  paddingTop?: number; // ★ 추가
}

export function ScreenContainer({
  children,
  audience = "elderly",
  scrollable = false,
  backgroundColor = Colors.surface.background,
  style,
  noPadding = false,
  paddingTop, // ★ 추가
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const padding = ScreenPadding[audience];
  const verticalTop = paddingTop ?? padding.vertical; // ★

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
  };

  const contentStyle: ViewStyle = noPadding
    ? { flex: 1 }
    : {
        flex: 1,
        paddingHorizontal: padding.horizontal,
        paddingTop: verticalTop, // ★
        paddingBottom: padding.vertical,
      };

  if (scrollable) {
    return (
      <View style={[containerStyle, style]}>
        <ScrollView
          contentContainerStyle={
            noPadding
              ? undefined
              : {
                  paddingHorizontal: padding.horizontal,
                  paddingTop: verticalTop, // ★
                  paddingBottom: padding.vertical,
                }
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
}
