import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";

export const BG_LOCATION_TASK = "BACKGROUND_LOCATION_REPORT";

export const LOG_FILE_PATH = FileSystem.documentDirectory + "location_log.txt";

TaskManager.defineTask(BG_LOCATION_TASK, async () => {
  try {
    const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const accurate =
      location.coords.accuracy !== null &&
      location.coords.accuracy !== undefined &&
      location.coords.accuracy <= 100;

    const logEntry =
      JSON.stringify({
        time: now,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy,
        reliable: accurate,
      }) + "\n";

    const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_PATH);
    if (fileInfo.exists) {
      const existing = await FileSystem.readAsStringAsync(LOG_FILE_PATH);
      await FileSystem.writeAsStringAsync(LOG_FILE_PATH, existing + logEntry);
    } else {
      await FileSystem.writeAsStringAsync(LOG_FILE_PATH, logEntry);
    }

    console.log("[BG_LOCATION] 기록 완료:", logEntry);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error("[BG_LOCATION] 에러:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundLocation() {
  const isRegistered =
    await TaskManager.isTaskRegisteredAsync(BG_LOCATION_TASK);
  if (!isRegistered) {
    await BackgroundTask.registerTaskAsync(BG_LOCATION_TASK, {
      minimumInterval: 30 * 60,
    });
    console.log("[BG_LOCATION] 태스크 등록 완료");
  }
}

export async function unregisterBackgroundLocation() {
  const isRegistered =
    await TaskManager.isTaskRegisteredAsync(BG_LOCATION_TASK);
  if (isRegistered) {
    await BackgroundTask.unregisterTaskAsync(BG_LOCATION_TASK);
    console.log("[BG_LOCATION] 태스크 해제 완료");
  }
}
