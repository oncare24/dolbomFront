import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../Text";
import { Colors, Spacing, Touch } from "../../../theme";
import { haptic } from "../../../utils/haptics";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
  audience?: "elderly" | "guardian";
}

/**
 * AppHeader
 * - 표준 헤더. SafeArea top inset을 자체적으로 흡수해서 어디서 쓰든 상태바 아래에 위치.
 * - side는 minWidth 56dp — rightElement가 길어지면(예: "관리" 텍스트) 확장됨.
 */
export function AppHeader({
  title,
  showBack = true,
  onBackPress,
  rightElement,
  audience = "elderly",
}: AppHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    haptic.light();
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const height = audience === "elderly" ? 64 : 56;
  const iconSize = audience === "elderly" ? 28 : 24;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={[styles.container, { height }]}>
        <View style={styles.side}>
          {showBack && (
            <Pressable
              onPress={handleBack}
              android_ripple={{
                color: Colors.gray[200],
                borderless: true,
                radius: 24,
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="뒤로 가기"
              style={styles.iconButton}
            >
              <Ionicons
                name="arrow-back"
                size={iconSize}
                color={Colors.text.primary}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.titleWrap}>
          {title && (
            <AppText
              variant={audience === "elderly" ? "h2" : "h3"}
              audience={audience}
              color="primary"
              numberOfLines={1}
            >
              {title}
            </AppText>
          )}
        </View>

        <View style={[styles.side, styles.sideRight]}>{rightElement}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface.background,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.divider,
  },
  side: {
    minWidth: Touch.comfortable,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  sideRight: {
    alignItems: "flex-end",
  },
  iconButton: {
    width: Touch.comfortable,
    height: Touch.comfortable,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
