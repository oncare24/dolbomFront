// src/screens/guardian/AnomalyLogScreen.tsx

// 보호자 — 특정 피보호자의 "이상감지 기록" 화면.
// 활동 이상(INACTIVITY_WARNING) + 복약 미복용(MEDICATION_MISSED) 알림만 모아
// 최신순으로 보여준다.
//
// 진입 경로:
//   - ProtegeDetail > 오늘의 요약 > "이상 감지" 카드 탭
//   - 알림센터(NotificationsScreen)에서 이상감지 타입 알림 탭
//
// 데이터: 별도의 분석 이력 테이블이 없어, 이상이 감지될 때마다 발송된 알림 기록
//   (notification_history → GET /api/notifications)을 type 으로 필터링해
//   "이상감지 로그"로 활용한다. 백엔드 추가 작업 없음.

import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader } from "../../components/common/Header";
import { ScreenContainer } from "../../components/common/Layout";
import { AppText } from "../../components/common/Text";
import { NotificationListItem } from "../../components/guardian/NotificationListItem";
import { useMarkAsRead, useNotifications } from "../../hooks/useNotifications";
import { useMyWards } from "../../hooks/useMyWards";
import { Colors, Spacing } from "../../theme";
import type {
  NotificationItem,
  NotificationType,
} from "../../types/notification";
import type { RootStackParamList } from "../../types/navigation";

type Route = RouteProp<RootStackParamList, "AnomalyLog">;
type Nav = NativeStackNavigationProp<RootStackParamList, "AnomalyLog">;

// "이상감지"로 분류하는 알림 타입 — 활동 이상 + 복약 미복용.
// (위치 끊김 DEVICE_DISCONNECTED·안전구역 이탈 ZONE_EXIT 등을 포함하고 싶으면 여기에 추가)
const ANOMALY_TYPES: NotificationType[] = [
  "INACTIVITY_WARNING",
  "MEDICATION_MISSED",
];

export default function AnomalyLogScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const protegeId = route.params.protegeId;

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useNotifications();
  const { data: wards = [] } = useMyWards();
  const markAsReadMutation = useMarkAsRead();

  const wardName = wards.find((w) => w.id === protegeId)?.name ?? "피보호자";

  // 이 피보호자의 이상감지 타입 알림만 추림. useNotifications 가 최신순이라 정렬 유지됨.
  const anomalyLogs = useMemo(
    () =>
      notifications.filter(
        (n) => n.wardId === protegeId && ANOMALY_TYPES.includes(n.type),
      ),
    [notifications, protegeId],
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // 로그 항목 탭 → 읽음 처리만. 이 화면 자체가 상세 기록이라 별도 라우팅 없음.
  const handleItemPress = useCallback(
    (n: NotificationItem) => {
      markAsReadMutation.mutate(n.id);
    },
    [markAsReadMutation],
  );

  return (
    <ScreenContainer audience="guardian" paddingTop={0} noPadding>
      <AppHeader title={`${wardName}님 이상감지 기록`} audience="guardian" />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <AppText variant="body" audience="guardian" color="danger">
            기록을 불러오지 못했어요.
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
          data={anomalyLogs}
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
                name="shield-checkmark-outline"
                size={48}
                color={Colors.text.disabled}
              />
              <AppText
                variant="body"
                audience="guardian"
                color="secondary"
                style={styles.emptyText}
              >
                아직 감지된 이상이 없어요
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
    flexGrow: 1,
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
