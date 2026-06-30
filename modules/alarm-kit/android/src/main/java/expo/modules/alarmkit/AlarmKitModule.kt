package expo.modules.alarmkit

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// 복약 풀스크린 알람을 위한 네이티브 보조 모듈.
//  - launchAlarmActivity(): 다른 앱 사용 중/홈 화면이어도 알람 액티비티를 강제로 띄움.
//    (SYSTEM_ALERT_WINDOW 권한이 있으면 백그라운드 액티비티 시작 제한 예외를 받음)
//  - 나머지 함수: 풀스크린 알람에 필요한 각 권한 상태 확인 + 해당 설정 화면 열기.
//
// 주의: expo의 Function 람다는 Unit(void) 반환을 거부한다("expected Any?").
//       따라서 동작만 하는 함수들도 마지막에 Boolean을 반환한다(JS에서는 무시).
class AlarmKitModule : Module() {
  private val context: Context?
    get() = appContext.reactContext

  override fun definition() = ModuleDefinition {
    Name("AlarmKit")

    // ── 다른 앱 위에 표시 (SYSTEM_ALERT_WINDOW / overlay) ──
    Function("canDrawOverlays") {
      val ctx = context ?: return@Function false
      Settings.canDrawOverlays(ctx)
    }

    Function("openOverlaySettings") {
      val ctx = context ?: return@Function false
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:" + ctx.packageName),
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
      true
    }

    // ── 전체 화면 알림 (USE_FULL_SCREEN_INTENT, Android 14+) ──
    Function("canUseFullScreenIntent") {
      val ctx = context ?: return@Function false
      if (Build.VERSION.SDK_INT >= 34) {
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.canUseFullScreenIntent()
      } else {
        true // 13 이하는 매니페스트 선언만으로 허용
      }
    }

    Function("openFullScreenIntentSettings") {
      val ctx = context ?: return@Function false
      if (Build.VERSION.SDK_INT >= 34) {
        val intent = Intent(
          Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
          Uri.parse("package:" + ctx.packageName),
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        ctx.startActivity(intent)
      }
      true
    }

    // ── 배터리 최적화 제외 ──
    Function("isIgnoringBatteryOptimizations") {
      val ctx = context ?: return@Function false
      val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(ctx.packageName)
    }

    Function("openBatteryOptimizationSettings") {
      val ctx = context ?: return@Function false
      try {
        // 앱 지정 "제한 없음" 요청 다이얼로그 (REQUEST_IGNORE_BATTERY_OPTIMIZATIONS 권한 필요)
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
          .setData(Uri.parse("package:" + ctx.packageName))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        ctx.startActivity(intent)
      } catch (e: Exception) {
        // 일부 기기에서 막히면 일반 배터리 최적화 목록으로 폴백
        try {
          val fallback = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          ctx.startActivity(fallback)
        } catch (e2: Exception) {
          Log.w("AlarmKit", "openBatteryOptimizationSettings failed: ${e2.message}")
        }
      }
      true
    }

    // ── 알람 액티비티 강제 실행 (다른 앱 위에서도) ──
    Function("launchAlarmActivity") {
      val ctx = context ?: return@Function false
      val intent = ctx.packageManager
        .getLaunchIntentForPackage(ctx.packageName)
        ?.addFlags(
          Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_SINGLE_TOP or
            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT,
        )
      if (intent == null) {
        Log.w("AlarmKit", "launchAlarmActivity: launch intent null")
        return@Function false
      }
      try {
        ctx.startActivity(intent)
      } catch (e: Exception) {
        // overlay 권한 없으면 백그라운드 액티비티 시작이 막힐 수 있음 → 알림(헤드업)으로 폴백
        Log.w("AlarmKit", "launchAlarmActivity blocked: ${e.message}")
      }
      true
    }
  }
}
