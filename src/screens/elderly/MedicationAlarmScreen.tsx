// 풀스크린 약 알람 화면.
//
// 책임:
//   1) 잠금화면 위로 떠올라 큰 글씨로 약 이름 표시
//   2) 진입 즉시 노래 재생 + TTS 5회 안내
//      (노래는 멈추지 않고 계속 틀되, TTS 중에만 볼륨을 낮춰 그 위에 얹음 → 정적 틈 없음)
//   3) 진입 시 같은 약의 헤드업/displayed 알림 명시적 cancel (중복 진입 방지)
//   4) "복용했어요" 누르면 Optimistic으로 즉시 캐시 반영 + 서버 기록 + 알람 종료
//   5) 뒤로가기 버튼 무효화 (실수 닫힘 방지, 시니어 UX)
//   6) 안 누르면 백엔드 미복용 감지 → 보호자 알림 안전망 (스누즈 불필요)
//
// 종료 정책: in-app 진입이면 goBack, cold-start면 ElderlyHome 폴백.
// takenAt: nowLocalDateTimeIso() 사용 — KST 보존 (toISOString의 UTC Z 회피).

import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  StatusBar,
  Pressable,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import notifee from "react-native-notify-kit";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import {
  speak,
  stop as stopSpeech,
} from "../../services/tutorialSpeechService";
import { useTakeMedication } from "../../hooks/useMedications";
import { useAuthStore } from "../../stores/authStore";
import { toastBridge } from "../../utils/toastBridge";
import { nowLocalDateTimeIso } from "../../utils/medicationSummary";
import type { RootStackParamList } from "../../types/navigation";
import { Colors } from "../../theme/colors";
import { useQueryClient } from "@tanstack/react-query";
import { medicationKeys } from "../../hooks/useMedications";
import { getMedicationLogsByDate } from "../../services/medicationService";
import type { MedicationLog } from "../../types/medication";

type Nav = NativeStackNavigationProp<RootStackParamList, "MedicationAlarm">;
type RouteProps = RouteProp<RootStackParamList, "MedicationAlarm">;

const TTS_MAX_COUNT = 5;
const SONG_DUCK_VOLUME = 0.12; // TTS 중 노래 볼륨 (작게 깔기)
const TTS_GAP_MS = 3500; // 안내와 다음 안내 사이, 노래만 들리는 구간
const FIRST_DELAY_MS = 1500; // 시작 후 첫 안내까지 (노래 먼저 들려주기)

export default function MedicationAlarmScreen() {
  const navigation = useNavigation<Nav>();
  const { scheduleId, medicationName } = useRoute<RouteProps>().params;
  const user = useAuthStore((s) => s.user);
  const takeMutation = useTakeMedication();

  const player = useAudioPlayer(
    require("../../assets/sounds/medication_alarm.mp3"),
  );

  const qc = useQueryClient();

  // 진입 즉시 오늘 복용 여부 체크 → 이미 복용했으면 자동 close.
  // skipToday로 trigger를 막아둔 게 메인 방어선이고, 이건 백업 안전망.
  useEffect(() => {
    const protegeId = user?.id;
    if (!protegeId) return;

    const today = nowLocalDateTimeIso().slice(0, 10);

    const cached = qc.getQueryData<MedicationLog[]>(
      medicationKeys.logsByDate(protegeId, today),
    );
    if (cached?.some((l) => l.scheduleId === scheduleId)) {
      stopSpeech();
      closeAlarm();
      return;
    }

    getMedicationLogsByDate(protegeId, today)
      .then((logs) => {
        if (logs.some((l) => l.scheduleId === scheduleId)) {
          stopSpeech();
          closeAlarm();
        }
      })
      .catch((e) => console.warn("[MED-ALARM] log check failed:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId, user?.id]);

  // 진입 즉시 같은 약의 헤드업/표시 알림 cancel — 풀스크린과 중복 노출 방지.
  useEffect(() => {
    notifee
      .getDisplayedNotifications()
      .then((displayed) => {
        for (const d of displayed) {
          const data = d.notification.data;
          if (
            data?.type === "MEDICATION_REMINDER" &&
            data.scheduleId === String(scheduleId) &&
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
  }, [scheduleId]);

  // 노래는 멈추지 않고 계속 재생(loop). TTS가 나올 때만 노래 볼륨을 낮춰
  // 그 위에 얹는다 → 정적 틈 없이 TTS가 또렷하게 들린다.
  useEffect(() => {
    const message = `${medicationName} 먹을 시간입니다`;
    let cancelled = false;
    let count = 0;
    let gapTimer: ReturnType<typeof setTimeout> | null = null;

    // 노래가 오디오 포커스를 독점하지 않게 → TTS와 매끄럽게 공존.
    // 무음/벨소리 OFF에서도 미디어 채널로 소리가 나옴.
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    }).catch((e) => console.warn("[MED-ALARM] setAudioMode failed:", e));

    player.loop = true;
    player.volume = 1.0;
    player.play(); // 노래 재생 시작 (계속 유지)

    const announce = () => {
      if (cancelled) return;
      count += 1;
      player.volume = SONG_DUCK_VOLUME; // 노래 살짝 줄임 (멈추지 않음)
      speak(message, () => {
        if (cancelled) return;
        player.volume = 1.0; // 노래 원래 볼륨 복원
        if (count >= TTS_MAX_COUNT) {
          player.pause(); // 5회 끝 → 종료
          return;
        }
        gapTimer = setTimeout(announce, TTS_GAP_MS); // 잠깐 노래만 → 다음 안내
      });
    };

    // 노래를 잠깐 들려준 뒤 첫 안내 시작
    gapTimer = setTimeout(announce, FIRST_DELAY_MS);

    return () => {
      cancelled = true;
      if (gapTimer) clearTimeout(gapTimer);
      stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicationName]);

  // 뒤로가기 무효화 — 시니어 실수 닫힘 방지
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  const closeAlarm = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace("ElderlyHome");
    }
  };

  const handleTook = () => {
    stopSpeech();
    player.pause();
    const protegeId = user?.id;
    if (user?.role === "elderly" && protegeId) {
      // Optimistic: 즉시 logsByDate 캐시에 추가 → 오늘의 약 화면 즉시 반영.
      // 서버 실패 시 useTakeMedication.onError가 자동 rollback.
      takeMutation.mutate({
        protegeId,
        scheduleId,
        medicationName,
        takenAt: nowLocalDateTimeIso(),
        logSource: "USER_INPUT",
      });
    }
    toastBridge.show("약 복용을 기록했어요", "success");
    closeAlarm();
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={styles.header}>
        <Text style={styles.label}>약 드실 시간이에요</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.pillIcon}>💊</Text>
        <Text style={styles.medName}>{medicationName}</Text>
        <Text style={styles.subText}>드실 시간입니다</Text>
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
          accessibilityLabel="약 복용했어요"
        >
          <Text style={styles.btnPrimaryText}>복용했어요</Text>
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
    marginTop: 80,
    alignItems: "center",
  },
  label: {
    fontSize: 20,
    color: "#FFFFFF",
    opacity: 0.9,
    letterSpacing: 0.2,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pillIcon: {
    fontSize: 96,
    marginBottom: 24,
  },
  medName: {
    fontSize: 44,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  subText: {
    fontSize: 24,
    color: "#FFFFFF",
    opacity: 0.95,
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
