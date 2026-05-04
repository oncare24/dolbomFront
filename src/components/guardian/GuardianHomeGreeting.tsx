// 보호자 홈 상단 인사말 + 우상단 알림 종.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Badge } from "../common/Badge";
import { Colors, Touch } from "../../theme";
import { haptic } from "../../utils/haptics";

interface Props {
  userName: string;
  unreadCount: number;
  onNotificationPress: () => void;
}

export function GuardianHomeGreeting({
  userName,
  unreadCount,
  onNotificationPress,
}: Props) {
  const handlePress = () => {
    haptic.light();
    onNotificationPress();
  };

  const hasUnread = unreadCount > 0;
  // 99 초과는 "99+"로 (시중앱 표준)
  const displayCount = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <AppText variant="caption" audience="guardian" color="secondary">
          안녕하세요
        </AppText>
        <AppText
          variant="h1"
          audience="guardian"
          color="primary"
          style={styles.name}
        >
          {userName}님
        </AppText>
      </View>

      <Pressable
        onPress={handlePress}
        android_ripple={{
          color: Colors.gray[200],
          borderless: true,
          radius: 24,
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          hasUnread ? `알림 ${unreadCount}개 안 읽음` : "알림"
        }
        style={styles.iconButton}
      >
        <Ionicons
          name="notifications-outline"
          size={26}
          color={Colors.text.primary}
        />
        {hasUnread && (
          <View style={styles.badgeWrap}>
            <Badge size="small" variant="danger">
              {displayCount}
            </Badge>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  textWrap: {
    flex: 1,
  },
  name: {
    marginTop: 2,
  },
  iconButton: {
    width: Touch.comfortable,
    height: Touch.comfortable,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeWrap: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
  },
});
