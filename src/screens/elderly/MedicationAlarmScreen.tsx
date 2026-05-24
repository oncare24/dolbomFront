// 풀스크린 약 알람 화면 (시각 단위).
//
// 책임:
//   1) 알림 data.time을 받아 "지금 이 시각에 먹을 약"을 직접 조회해 목록으로 표시
//   2) 진입 즉시 노래 재생 + TTS 안내 (노래 위에 TTS를 얹어 정적 틈 없음)
//   3) 진입 시 같은 시각 헤드업/displayed 알림 cancel (중복 진입 방지)
//   4) "다 먹었어요" → 그 시각 약 전부 Optimistic 기록 + 알람 종료
//   5) 뒤로가기 무효화 (시니어 실수 닫힘 방지)
//   6) 먹을 약이 없으면(이미 복용/오늘 해당 없음) 화면 안 띄우고 자동 종료

import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  StatusBar,
  Pressable,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import notifee from "react-native-notify-kit";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import {
  speak,
  stop as stopSpeech,
} from "../../services/tutorialSpeechService";
import {
  useTakeMedication,
  useMedicationSchedules,
  useMedicationLogsByDate,
} from "../../hooks/useMedications";
import { useAuthStore } from "../../stores/authStore";
import { toastBridge } from "../../utils/toastBridge";
import { nowLocalDateTimeIso } from "../../utils/medicationSummary";
import type { RootStackParamList } from "../../types/navigation";
import { Colors } from "../../theme/colors";
import type { DayOfWeek } from "../../types/medication";

type Nav = NativeStackNavigationProp<RootStackParamList, "MedicationAlarm">;
type RouteProps = RouteProp<RootStackParamList, "MedicationAlarm">;

const TTS_MAX_COUNT = 5;
const SONG_DUCK_VOLUME = 0.12;
const TTS_GAP_MS = 3500;
const FIRST_DELAY_MS = 1500;

const WD: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function slotLabel(hour: number): string {
  if (hour < 11) return "아침";
  if (hour < 17) return "점심";
  if (hour < 21) return "저녁";
  return "밤";
}

function formatTime(time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  const ampm = hh < 12 ? "오전" : "오후";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${ampm} ${h12}:${String(mm).padStart(2, "0")}`;
}

export default function MedicationAlarmScreen() {
  const navigation = useNavigation<Nav>();
  const { time } = useRoute<RouteProps>().params;
  const user = useAuthStore((s) => s.user);
  const protegeId = user?.id ?? 0;
  const takeMutation = useTakeMedication();

  const player = useAudioPlayer(
    require("../../assets/sounds/medication_alarm.mp3"),
  );

  const today = nowLocalDateTimeIso().slice(0, 10);
  const { data: schedules } = useMedicationSchedules(protegeId, {
    enabled: !!protegeId,
  });
  const { data: todayLogs } = useMedicationLogsByDate(protegeId, today, {
    enabled: !!protegeId,
  });

  // 지금 이 시각에 먹어야 할 약(아직 복용 안 한) 목록.
  // null = 아직 로딩 중 / 배열 = 계산 완료.
  const dueDrugs = useMemo(() => {
    if (!schedules) return null;
    const takenIds = new Set(
      (todayLogs ?? [])
        .map((l) => l.scheduleId)
        .filter((id): id is number => id != null),
    );
    const wd = new Date().getDay();
    return schedules.filter((s) => {
      if (!s.active) return false;
      if (s.scheduledTime !== time) return false;
      if (takenIds.has(s.id)) return false;
      if (
        s.scheduleType === "WEEKLY" &&
        !s.daysOfWeek.some((w) => WD[w] === wd)
      )
        return false;
      if (s.startDate && today < s.startDate) return false;
      if (s.endDate && today > s.endDate) return false;
      return true;
    });
  }, [schedules, todayLogs, time, today]);

  const closeRef = useRef(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace("ElderlyHome");
  });
  closeRef.current = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace("ElderlyHome");
  };
  const closeAlarm = () => closeRef.current();

  // 먹을 약이 없으면(이미 다 복용 / 오늘 해당 없음) 화면 안 띄우고 자동 종료.
  useEffect(() => {
    if (dueDrugs === null) return; // 로딩 중
    if (dueDrugs.length === 0) {
      stopSpeech();
      closeRef.current();
    }
  }, [dueDrugs]);

  // 진입 즉시 같은 시각 헤드업/표시 알림 cancel — 풀스크린과 중복 노출 방지.
  useEffect(() => {
    notifee
      .getDisplayedNotifications()
      .then((displayed) => {
        for (const d of displayed) {
          const data = d.notification.data;
          if (
            data?.type === "MEDICATION_REMINDER" &&
            data.time === time &&
            d.notification.id
          ) {
            notifee
              .cancelDisplayedNotification(d.notification.id)
              .catch((e) =>
                console.warn("[MED-ALARM] cancel displayed failed:", e),
              );
          }
        }
      })
      .catch((e) =>
        console.warn("[MED-ALARM] getDisplayedNotifications failed:", e),
      );
  }, [time]);

  // 노래 + TTS — 먹을 약이 정해지면(있을 때) 1회 시작.
  const startedRef = useRef(false);
  const ttsCancelledRef = useRef(false);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef(0);

  useEffect(() => {
    if (startedRef.current) return;
    if (!dueDrugs || dueDrugs.length === 0) return;
    startedRef.current = true;

    const names = dueDrugs.map((d) => d.medicationName);
    const message =
      names.length === 1
        ? `${names[0]} 드실 시간입니다`
        : `약 드실 시간입니다. ${names.length}가지 약을 확인해 주세요`;

    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    }).catch((e) => console.warn("[MED-ALARM] setAudioMode failed:", e));

    player.loop = true;
    player.volume = 1.0;
    player.play();

    const announce = () => {
      if (ttsCancelledRef.current) return;
      countRef.current += 1;
      player.volume = SONG_DUCK_VOLUME;
      speak(message, () => {
        if (ttsCancelledRef.current) return;
        player.volume = 1.0;
        if (countRef.current >= TTS_MAX_COUNT) {
          player.pause();
          return;
        }
        gapTimerRef.current = setTimeout(announce, TTS_GAP_MS);
      });
    };

    gapTimerRef.current = setTimeout(announce, FIRST_DELAY_MS);
    // 정리는 아래 언마운트 effect에서 한 번만.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueDrugs]);

  // 언마운트 시 1회 정리 (도중 dueDrugs 변해도 노래 안 끊김).
  useEffect(() => {
    return () => {
      ttsCancelledRef.current = true;
      if (gapTimerRef.current) clearTimeout(gapTimerRef.current);
      stopSpeech();
      player.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 뒤로가기 무효화 — 시니어 실수 닫힘 방지
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  const handleTook = () => {
    stopSpeech();
    player.pause();
    if (user?.role === "elderly" && protegeId && dueDrugs) {
      const takenAt = nowLocalDateTimeIso();
      for (const d of dueDrugs) {
        takeMutation.mutate({
          protegeId,
          scheduleId: d.id,
          medicationName: d.medicationName,
          takenAt,
          logSource: "USER_INPUT",
        });
      }
    }
    toastBridge.show("약 복용을 기록했어요", "success");
    closeAlarm();
  };

  // 로딩 중이거나 먹을 약이 없으면(자동 종료 진행 중) 빈 화면.
  if (!dueDrugs || dueDrugs.length === 0) {
    return <View style={styles.container} />;
  }

  const hour = parseInt(time.split(":")[0], 10);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={styles.header}>
        <Text style={styles.label}>{slotLabel(hour)} 약 드실 시간이에요</Text>
        <Text style={styles.time}>{formatTime(time)}</Text>
      </View>

      <View style={styles.body}>
        <ScrollView
          style={styles.listCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {dueDrugs.map((d, i) => (
            <View
              key={d.id}
              style={[
                styles.drugRow,
                i < dueDrugs.length - 1 && styles.drugRowBorder,
              ]}
            >
              <Text style={styles.drugName}>{d.medicationName}</Text>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.countText}>
          지금 드실 약 {dueDrugs.length}가지예요
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            styles.btnPrimary,
            pressed && styles.btnPressed,
          ]}
          onPress={handleTook}
          accessibilityRole="button"
          accessibilityLabel="약 다 먹었어요"
        >
          <Text style={styles.btnPrimaryText}>다 먹었어요</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 72,
    alignItems: "center",
  },
  label: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  time: {
    fontSize: 20,
    color: "#FFFFFF",
    opacity: 0.95,
    marginTop: 8,
  },
  body: {
    flex: 1,
    justifyContent: "center",
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    flexGrow: 0,
    maxHeight: 320,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  drugRow: {
    paddingVertical: 18,
  },
  drugRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  drugName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 0.2,
  },
  countText: {
    fontSize: 18,
    color: "#FFFFFF",
    opacity: 0.95,
    textAlign: "center",
    marginTop: 18,
  },
  actions: {
    paddingBottom: 48,
  },
  btn: {
    minHeight: 96,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  btnPrimary: {
    backgroundColor: "#FFFFFF",
    elevation: 4,
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
  },
  btnPrimaryText: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.brand.primary,
    letterSpacing: 0.2,
  },
});
