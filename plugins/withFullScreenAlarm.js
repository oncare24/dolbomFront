const { withAndroidManifest } = require("@expo/config-plugins");

// MainActivity에 showWhenLocked + turnScreenOn 속성 주입.
// 잠금화면 위로 풀스크린 알람 액티비티가 자동 진입할 수 있게 함.
module.exports = function withFullScreenAlarm(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    const mainActivity = app?.activity?.find((a) => {
      const name = a.$["android:name"];
      return name === ".MainActivity" || name?.endsWith(".MainActivity");
    });
    if (mainActivity) {
      mainActivity.$["android:showWhenLocked"] = "true";
      mainActivity.$["android:turnScreenOn"] = "true";
    } else {
      console.warn("[withFullScreenAlarm] MainActivity not found");
    }
    return cfg;
  });
};
