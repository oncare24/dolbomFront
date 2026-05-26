// 보호자 알림센터 화면.
//
// 흐름:
//   - 진입 즉시 useNotifications로 목록 조회
//   - 카드 탭 → useMarkAsRead 호출 (Optimistic으로 UI 즉시 갱신)
//   - Pull-to-refresh 지원
//   - 빈 상태: "받은 알림이 없어요" 안내
//
// 라우팅: GuardianHome 종 아이콘에서 navigation.navigate("Notifications")로 진입.
// 향후 확장: 알림 카드 탭 시 관련 화면(SafetyZoneList 등)으로 이동 가능.
//   현재는 읽음 처리만.
//
// 레이아웃:
//   - ScreenContainer로 SafeArea 처리(시스템 상단 바 영역 회피).
//   - noPadding=true: 헤더가 좌우 끝까지 닿도록(헤더 자체가 paddingHorizontal 가짐).
//   - paddingTop=0: 헤더 위 추가 여백 제거.
//   - FlatList는 가상화 때문에 ScrollView로 감싸면 안 되므로 scrollable=false 유지.

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "../../components/common/Header";
import { ScreenContainer } from "../../components/common/Layout";
import { AppText } from "../../components/common/Text";
import { NotificationListItem } from "../../components/guardian/NotificationListItem";
import { useMarkAsRead, useNotifications } from "../../hooks/useNotifications";
import { Colors, Spacing } from "../../theme";
import type { NotificationItem } from "../../types/notification";
import type { RootStackParamList } from "../../types/navigation";
import { Pressable } from "react-native";
import { haptic } from "../../utils/haptics";
type Nav = NativeStackNavigationProp<RootStackParamList, "Notifications">;

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useNotifications();

  const markAsReadMutation = useMarkAsRead();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleItemPress = useCallback(
    (notification: NotificationItem) => {
      // 1) 읽음 처리는 항상 (Optimistic이라 즉시 UI 반영)
      markAsReadMutation.mutate(notification.id);

      // 2) type별 라우팅 분기.
      //    "이 알림을 받은 보호자가 자연스럽게 다음에 가고 싶어할 화면"으로 이동.
      //    wardId가 없는 알림은 라우팅하지 않음 (읽음 처리만).
      const wardId = notification.wardId;
      if (wardId == null) return;

      switch (notification.type) {
        case "SOS":
          // SOS 알림 → 위치 보기 화면. eventId 없으면 라우팅 스킵 (이전 버전 알림 안전 폴백)
          if (notification.sosEventId != null) {
            navigation.navigate("SosLocationView", {
              eventId: notification.sosEventId,
            });
          }
          break;

        case "ZONE_EXIT":
        case "ZONE_ENTER":
        case "DEVICE_DISCONNECTED":
          // 위치/안전 관련 알림 → 해당 피보호자의 안전구역 목록 화면.
          navigation.navigate("SafetyZoneList", { protegeId: wardId });
          break;
        case "INACTIVITY_WARNING":
        case "MEDICATION_MISSED":
          // 이상감지 알림 → 해당 피보호자 이상감지 기록 화면.
          navigation.navigate("AnomalyLog", { protegeId: wardId });
          break;

        case "WARD_INVITATION":
          // 보호자는 이 알림을 받지 않음 (피보호자만 받음). 안전 폴백.
          break;

        case "DRUG_ANALYSIS_REFRESH_REQUEST":
          // 보호자는 이 알림을 받지 않음 (피보호자만 받음). 안전 폴백.
          break;
      }
    },
    [markAsReadMutation, navigation],
  );
  return (
    <ScreenContainer audience="guardian" paddingTop={0} noPadding>
      <AppHeader
        title="알림"
        audience="guardian"
        rightElement={
          <Pressable
            onPress={() => {
              haptic.light();
              navigation.navigate("NotificationPreferences");
            }}
            hitSlop={8}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={Colors.text.primary}
            />
          </Pressable>
        }
      />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <AppText variant="body" audience="guardian" color="danger">
            알림을 불러오지 못했어요.
          </AppText>
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            style={styles.errorHint}
          >
            아래로 당겨서 다시 시도해주세요.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <NotificationListItem
              notification={item}
              onPress={handleItemPress}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color={Colors.text.disabled}
              />
              <AppText
                variant="body"
                audience="guardian"
                color="secondary"
                style={styles.emptyText}
              >
                받은 알림이 없어요
              </AppText>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.brand.primary}
              colors={[Colors.brand.primary]}
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  errorHint: {
    marginTop: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    flexGrow: 1, // 빈 상태일 때 ListEmptyComponent를 화면 가운데로
  },
  separator: {
    height: Spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.md,
  },
});
