// 보호자 알림 설정 화면.
//
// 흐름:
//   - 진입 즉시 useNotificationPreference로 설정 조회 (행 없으면 백엔드가 default 생성)
//   - 토글 변경 → Optimistic으로 즉시 반영 + 서버 PATCH 호출
//   - 시각 카드 탭 → DateTimePicker 모달 → "확인" 시 PATCH 호출
//   - 다이제스트 OFF면 시각 카드 비활성 (opacity 낮춰서 탭 불가)
//
// 진입: NotificationsScreen 헤더 톱니바퀴 → navigate("NotificationPreferences").

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { AppHeader } from "../../components/common/Header";
import { ScreenContainer } from "../../components/common/Layout";
import { AppText } from "../../components/common/Text";
import { Card } from "../../components/common/Card";
import {
  useNotificationPreference,
  useUpdateNotificationPreference,
} from "../../hooks/useNotificationPreferences";
import { Colors, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";

export default function NotificationPreferencesScreen() {
  const { data: pref, isLoading, isError } = useNotificationPreference();
  const updateMutation = useUpdateNotificationPreference();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleToggleImmediate = useCallback(
    (value: boolean) => {
      haptic.medium();
      updateMutation.mutate({ immediateMedicationAlert: value });
    },
    [updateMutation],
  );

  const handleToggleDigest = useCallback(
    (value: boolean) => {
      haptic.medium();
      updateMutation.mutate({ dailyDigestEnabled: value });
    },
    [updateMutation],
  );

  const handleTimeChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowTimePicker(false); // Android는 select/dismiss 둘 다 닫기
      if (event.type === "set" && selectedDate) {
        const hh = String(selectedDate.getHours()).padStart(2, "0");
        const mm = String(selectedDate.getMinutes()).padStart(2, "0");
        haptic.light();
        updateMutation.mutate({ dailyDigestTime: `${hh}:${mm}` });
      }
    },
    [updateMutation],
  );

  if (isLoading) {
    return (
      <ScreenContainer noPadding>
        <AppHeader title="알림 설정" audience="guardian" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (isError || !pref) {
    return (
      <ScreenContainer noPadding>
        <AppHeader title="알림 설정" audience="guardian" />
        <View style={styles.center}>
          <AppText style={styles.errorText}>설정을 불러오지 못했어요</AppText>
        </View>
      </ScreenContainer>
    );
  }

  const timeAsDate = parseTimeToDate(pref.dailyDigestTime);
  const digestOff = !pref.dailyDigestEnabled;

  return (
    <ScreenContainer noPadding>
      <AppHeader title="알림 설정" audience="guardian" />

      <View style={styles.content}>
        {/* 약 미복용 즉시 알림 */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.textBlock}>
              <AppText style={styles.label}>약 미복용 즉시 알림</AppText>
              <AppText style={styles.description}>
                같은 약을 연속으로 빼먹는 등 패턴이 보일 때만 즉시 알림이 와요.
              </AppText>
            </View>
            <Switch
              value={pref.immediateMedicationAlert}
              onValueChange={handleToggleImmediate}
              trackColor={{
                false: Colors.gray[300],
                true: Colors.brand.primaryLight,
              }}
              thumbColor={
                pref.immediateMedicationAlert
                  ? Colors.brand.primary
                  : Colors.gray[500]
              }
            />
          </View>
        </Card>

        {/* 매일 저녁 요약 */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.textBlock}>
              <AppText style={styles.label}>매일 저녁 요약 알림</AppText>
              <AppText style={styles.description}>
                정해진 시각에 그날 빼먹은 약을 한 번에 모아서 알려드려요.
              </AppText>
            </View>
            <Switch
              value={pref.dailyDigestEnabled}
              onValueChange={handleToggleDigest}
              trackColor={{
                false: Colors.gray[300],
                true: Colors.brand.primaryLight,
              }}
              thumbColor={
                pref.dailyDigestEnabled
                  ? Colors.brand.primary
                  : Colors.gray[500]
              }
            />
          </View>
        </Card>

        {/* 요약 받을 시각 — 다이제스트 OFF면 비활성 */}
        <Pressable
          onPress={() => {
            if (digestOff) return;
            haptic.light();
            setShowTimePicker(true);
          }}
          disabled={digestOff}
        >
          <Card style={[styles.card, digestOff && styles.disabledCard]}>
            <View style={styles.row}>
              <View style={styles.textBlock}>
                <AppText style={styles.label}>요약 받을 시각</AppText>
                <AppText style={styles.description}>
                  매일 이 시각에 미복용 요약이 와요
                </AppText>
              </View>
              <AppText style={styles.timeValue}>{pref.dailyDigestTime}</AppText>
            </View>
          </Card>
        </Pressable>
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={timeAsDate}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScreenContainer>
  );
}

/** "22:00" → Date (오늘 22:00). DateTimePicker 초기값용. */
function parseTimeToDate(time: string): Date {
  const [hh, mm] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
  },
  disabledCard: {
    opacity: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Spacing.xxs,
  },
  description: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.brand.primary,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: Colors.text.secondary,
  },
});
