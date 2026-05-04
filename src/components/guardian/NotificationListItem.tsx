// 알림 목록 단일 카드.
//
// 좌측 타입별 아이콘 → 중앙 제목/본문/시각 → 우측 안 읽음 표시(파란 점).
// readAt이 null이면 미확인 상태로 강조: 배경 살짝 어둡게 + 우측 파란 점.
// onPress: 부모에서 markAsRead + 필요시 상세 라우팅 처리.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Spacing } from "../../theme";
import { Elevation } from "../../theme/elevation";
import {
  formatRelativeTime,
  getNotificationIcon,
} from "../../utils/notificationFormat";
import { haptic } from "../../utils/haptics";
import type { NotificationItem } from "../../types/notification";

interface Props {
  notification: NotificationItem;
  onPress: (notification: NotificationItem) => void;
}

export function NotificationListItem({ notification, onPress }: Props) {
  const isUnread = notification.readAt === null;
  const icon = getNotificationIcon(notification.type);

  const handlePress = () => {
    haptic.light();
    onPress(notification);
  };

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: Colors.gray[200] }}
      style={({ pressed }) => [
        styles.card,
        isUnread && styles.cardUnread,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}, ${isUnread ? "안 읽음" : "읽음"}`}
    >
      {/* 좌측 아이콘 */}
      <View style={[styles.iconWrap, { backgroundColor: icon.bgColor }]}>
        <Ionicons name={icon.name as any} size={22} color={icon.color} />
      </View>

      {/* 중앙 텍스트 */}
      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <AppText
            variant={isUnread ? "bodyBold" : "body"}
            audience="guardian"
            color="primary"
            style={styles.title}
            numberOfLines={1}
          >
            {notification.title}
          </AppText>
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            style={styles.time}
          >
            {formatRelativeTime(notification.createdAt)}
          </AppText>
        </View>
        <AppText
          variant="caption"
          audience="guardian"
          color="secondary"
          style={styles.body}
          numberOfLines={2}
        >
          {notification.body}
        </AppText>
      </View>

      {/* 우측 안 읽음 점 */}
      {isUnread && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.card,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 72,
    ...Elevation.sm,
  },
  cardUnread: {
    backgroundColor: Colors.brand.primaryLight,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  time: {
    flexShrink: 0,
  },
  body: {
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand.primary,
    marginLeft: Spacing.sm,
  },
});
