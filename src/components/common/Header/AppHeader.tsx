import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppText } from "../Text";
import { Colors, Spacing, Touch } from "../../../theme";
import { haptic } from "../../../utils/haptics";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void; // 지정하면 기본 goBack 대체
  rightElement?: React.ReactNode; // 우측 액션 (설정 아이콘 등)
  audience?: "elderly" | "guardian";
}

/**
 * AppHeader
 * - 표준 헤더. 좌측 뒤로가기 / 중앙 타이틀 / 우측 액션.
 * - 시니어 화면(elderly): 높이 64dp, 타이틀 h2(24sp).
 * - 보호자 화면(guardian): 높이 56dp, 타이틀 h3(18sp).
 */
export function AppHeader({
  title,
  showBack = true,
  onBackPress,
  rightElement,
  audience = "elderly",
}: AppHeaderProps) {
  const navigation = useNavigation();

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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.divider,
  },
  side: {
    width: Touch.comfortable,
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
