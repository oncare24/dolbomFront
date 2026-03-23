import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";
import {
  registerBackgroundLocation,
  unregisterBackgroundLocation,
  LOG_FILE_PATH,
} from "../../tasks/backgroundLocation";

export default function LocationTestScreen() {
  const [logs, setLogs] = useState<string>("로그 없음");
  const [isRunning, setIsRunning] = useState(false);

  const loadLogs = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_PATH);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(LOG_FILE_PATH);
        setLogs(content);
      } else {
        setLogs("아직 기록된 위치가 없습니다.");
      }
    } catch (e) {
      setLogs("로그 읽기 실패: " + e);
    }
  };

  const handleStart = async () => {
    const { status: foreground } =
      await Location.requestForegroundPermissionsAsync();
    if (foreground !== "granted") {
      Alert.alert("권한 필요", "위치 권한을 허용해주세요.");
      return;
    }

    const { status: background } =
      await Location.requestBackgroundPermissionsAsync();
    if (background !== "granted") {
      Alert.alert("권한 필요", '"항상 허용"으로 설정해주세요.');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const now = new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
      });
      const testLog =
        JSON.stringify({
          time: now,
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          accuracy: location.coords.accuracy,
          reliable:
            location.coords.accuracy !== null &&
            location.coords.accuracy !== undefined &&
            location.coords.accuracy <= 100,
          note: "수동 테스트",
        }) + "\n";

      const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_PATH);
      if (fileInfo.exists) {
        const existing = await FileSystem.readAsStringAsync(LOG_FILE_PATH);
        await FileSystem.writeAsStringAsync(LOG_FILE_PATH, existing + testLog);
      } else {
        await FileSystem.writeAsStringAsync(LOG_FILE_PATH, testLog);
      }
    } catch (e) {
      console.log("수동 테스트 기록 실패:", e);
    }

    await registerBackgroundLocation();
    setIsRunning(true);
    Alert.alert(
      "시작 완료",
      "30분 간격으로 위치를 기록합니다.\n화면을 끄고 주머니에 넣으세요!",
    );
    loadLogs();
  };

  const handleStop = async () => {
    await unregisterBackgroundLocation();
    setIsRunning(false);
    Alert.alert("중지", "백그라운드 위치 기록을 중지했습니다.");
  };

  const handleClear = async () => {
    await FileSystem.deleteAsync(LOG_FILE_PATH, { idempotent: true });
    setLogs("로그 없음");
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>백그라운드 위치 테스트</Text>
      <Text style={styles.status}>
        상태: {isRunning ? "🟢 기록 중" : "🔴 중지"}
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#4CAF50" }]}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>시작</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#f44336" }]}
          onPress={handleStop}
        >
          <Text style={styles.buttonText}>중지</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#2196F3" }]}
          onPress={loadLogs}
        >
          <Text style={styles.buttonText}>새로고침</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#FF9800" }]}
          onPress={handleClear}
        >
          <Text style={styles.buttonText}>초기화</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logBox}>
        <Text style={styles.logText}>{logs}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff", paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  status: { fontSize: 18, marginBottom: 20 },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  logBox: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
  },
  logText: { fontSize: 13, fontFamily: "monospace", lineHeight: 20 },
});
