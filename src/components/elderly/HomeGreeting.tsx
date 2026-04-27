// 피보호자 홈 상단 인사말 + 우상단 설정.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Spacing, Touch } from "../../theme";
import { haptic } from "../../utils/haptics";

interface Props {
  userName: string;
  onSettingsPress: () => void;
}

export function HomeGreeting({ userName, onSettingsPress }: Props) {
  const handlePress = () => {
    haptic.light();
    onSettingsPress();
  };

  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <AppText variant="bodyBold" color="secondary">
          안녕하세요
        </AppText>
        <AppText variant="display" color="primary" style={styles.name}>
          {userName} 어르신
        </AppText>
      </View>

      <Pressable
        onPress={handlePress}
        android_ripple={{
          color: Colors.gray[200],
          borderless: true,
          radius: 28,
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="설정"
        style={styles.iconButton}
      >
        <Ionicons
          name="settings-outline"
          size={28}
          color={Colors.text.primary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 0,
  },
  textWrap: {
    flex: 1,
  },
  name: {
    marginTop: 4,
  },
  iconButton: {
    width: Touch.comfortable,
    height: Touch.comfortable,
    alignItems: "center",
    justifyContent: "center",
  },
});
