import React from "react";
import {
  RefreshControl,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
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
  paddingTop?: number;
  /** Pull-to-refresh 지원. scrollable=true 일 때만 동작. */
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ScreenContainer({
  children,
  audience = "elderly",
  scrollable = false,
  backgroundColor = Colors.surface.background,
  style,
  noPadding = false,
  paddingTop,
  refreshing,
  onRefresh,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const padding = ScreenPadding[audience];
  const verticalTop = paddingTop ?? padding.vertical;

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
        paddingTop: verticalTop,
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
                  paddingTop: verticalTop,
                  paddingBottom: padding.vertical,
                }
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing ?? false}
                onRefresh={onRefresh}
                colors={[Colors.brand.primary]}
                tintColor={Colors.brand.primary}
              />
            ) : undefined
          }
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
