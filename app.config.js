// Expo dynamic config — process.env 사용 가능 (app.json은 정적이라 못 씀)
//
// EAS 빌드 시: process.env.GOOGLE_SERVICES_JSON 이 EAS Secret이 가리키는 임시 파일 경로로 주입됨
// 로컬 빌드 시: 루트의 ./google-services.json 사용

module.exports = {
  expo: {
    name: "bosalpimFront",
    slug: "bosalpimFront",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    androidStatusBar: {
      barStyle: "dark-content",
      backgroundColor: "#F5F6F8",
    },
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#F5F6F8",
    },
    android: {
      package: "com.haeram.dolbom",
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      useNextNotificationsApi: true,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "RECORD_AUDIO",
        "POST_NOTIFICATIONS",
        "SCHEDULE_EXACT_ALARM",
        "USE_EXACT_ALARM",
        "USE_FULL_SCREEN_INTENT",
        "SYSTEM_ALERT_WINDOW", // ← 추가: 홈 화면/딴 앱 위에서도 풀스크린 알람 허용
        "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS", // ← 배터리 최적화 제외 요청 다이얼로그
        "VIBRATE",
        "WAKE_LOCK",
        "RECEIVE_BOOT_COMPLETED",
      ],
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "@mj-studio/react-native-naver-map",
        {
          client_id: "gfu5pdx5su",
        },
      ],
      [
        "@jamsch/expo-speech-recognition",
        {
          microphonePermission: "음성으로 입력하기 위해 마이크를 사용합니다.",
          speechRecognitionPermission:
            "음성을 글로 옮기기 위해 음성 인식을 사용합니다.",
          androidSpeechServicePackages: [
            "com.google.android.googlequicksearchbox",
          ],
        },
      ],
      "expo-secure-store",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "위치 기반 안전 서비스를 위해 항상 위치 접근이 필요합니다.",
          locationAlwaysPermission:
            "백그라운드에서 위치를 수집하기 위해 항상 허용이 필요합니다.",
          locationWhenInUsePermission: "길안내를 위해 위치 접근이 필요합니다.",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#3478F6",
          defaultChannel: "default",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            extraMavenRepos: ["https://repository.map.naver.com/archive/maven"],
          },
        },
      ],
      "./plugins/withFullScreenAlarm",
      "expo-audio",
    ],
    extra: {
      eas: {
        projectId: "43cdb121-644c-4e46-8e94-190bbf37aa5c",
      },
    },
    owner: "haeramram",
    updates: {
      url: "https://u.expo.dev/43cdb121-644c-4e46-8e94-190bbf37aa5c",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
  },
};
