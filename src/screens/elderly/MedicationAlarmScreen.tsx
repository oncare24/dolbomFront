// 풀스크린 약 알람 화면.
//
// 책임:
//   1) 잠금화면 위로 떠올라 큰 글씨로 약 이름 표시
//   2) 진입 즉시 TTS 음성 재생, 5초 간격 5회 반복 (0/5/10/15/20초, 총 25초)
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

type Nav = NativeStackNavigationProp<RootStackParamList, "MedicationAlarm">;
type RouteProps = RouteProp<RootStackParamList, "MedicationAlarm">;

const TTS_INTERVAL_MS = 5000;
const TTS_MAX_COUNT = 5;

export default function MedicationAlarmScreen() {
  const navigation = useNavigation<Nav>();
  const { scheduleId, medicationName } = useRoute<RouteProps>().params;
  const user = useAuthStore((s) => s.user);
  const takeMutation = useTakeMedication();

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

  // TTS 5초 간격 5회 반복 (0/5/10/15/20초). 마지막 재생 후 정지.
  useEffect(() => {
    const message = `${medicationName} 먹을 시간입니다`;
    let count = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const playTTS = () => {
      speak(message);
      count++;
      if (count >= TTS_MAX_COUNT && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    playTTS();
    intervalId = setInterval(playTTS, TTS_INTERVAL_MS);

    return () => {
      if (intervalId) clearInterval(intervalId);
      stopSpeech();
    };
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
