// 복약 알람 권한 온보딩 화면 (피보호자/어르신용).
//
// 풀스크린 알람이 화면 꺼짐·다른 앱 사용 중에도 확실히 뜨려면 여러 권한이 필요한데,
// 안드로이드는 이걸 한 번에 못 묻고 종류마다 따로 허용해야 한다.
// 이 화면이 필요한 권한을 큰 글씨 + 아이콘으로 하나씩 안내하고, "허용" 누르면
// OS 다이얼로그/설정으로 보낸다. 설정에서 켜고 돌아오면(AppState active) 자동으로
// 상태를 다시 확인해 "허용됨"으로 바뀐다.
//
// 고령자 UX 원칙:
//   - 큰 글씨 + 권한별 아이콘으로 한눈에 구분
//   - 진행률 바로 "얼마나 남았는지" 직관적으로 표시
//   - 터치 영역 넉넉히(허용/완료 버튼 56pt+)
//   - 필수/선택을 색과 칩으로 명확히 구분

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  AppState,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import type { RootStackParamList } from "../../types/navigation";
import {
  PERMISSION_ITEMS,
  checkAllPermissions,
  requestPermission,
  type PermKey,
} from "../../services/permissionService";

type Nav = NativeStackNavigationProp<RootStackParamList, "PermissionSetup">;
type IconName = React.ComponentProps<typeof Ionicons>["name"];

// 권한별 아이콘 — 글씨를 못 읽어도 그림으로 구분되게.
const PERM_ICON: Record<PermKey, IconName> = {
  notifications: "notifications",
  fullScreenIntent: "phone-portrait",
  overlay: "layers",
  exactAlarm: "alarm",
  battery: "battery-charging",
};

export default function PermissionSetupScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<Record<PermKey, boolean> | null>(null);
  const [busyKey, setBusyKey] = useState<PermKey | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await checkAllPermissions());
    } catch {
      /* 무시 — 다음 갱신에서 재시도 */
    }
  }, []);

  useEffect(() => {
    refresh();
    // 설정 화면 갔다 돌아오면 다시 확인.
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const handleAllow = async (key: PermKey) => {
    setBusyKey(key);
    try {
      await requestPermission(key);
    } catch {
      /* 무시 */
    } finally {
      setBusyKey(null);
      // notifications는 다이얼로그 결과가 바로 반영되므로 한 번 더 확인.
      refresh();
    }
  };

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: "ElderlyHome" }] });
  };

  const criticalItems = PERMISSION_ITEMS.filter((i) => i.critical);
  const grantedCriticalCount =
    status == null ? 0 : criticalItems.filter((i) => status[i.key]).length;
  const allCriticalGranted =
    status != null && grantedCriticalCount === criticalItems.length;
  const remainingCritical = criticalItems.length - grantedCriticalCount;
  const progress = criticalItems.length
    ? grantedCriticalCount / criticalItems.length
    : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 헤더 ─── */}
        <View style={styles.heroIcon}>
          <Ionicons
            name="notifications"
            size={32}
            color={Colors.brand.primary}
          />
        </View>
        <Text style={styles.title}>알람 권한 설정</Text>
        <Text style={styles.subtitle}>
          화면이 꺼져 있어도, 다른 앱을 쓰는 중에도{"\n"}약 알람이 확실히 뜨도록
          허용해 주세요.
        </Text>

        {/* ─── 진행률 ─── */}
        {status != null && (
          <View style={styles.progressCard}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressLabel}>
                {allCriticalGranted
                  ? "필수 권한이 모두 켜졌어요"
                  : "꼭 필요한 권한"}
              </Text>
              <Text style={styles.progressCount}>
                <Text style={styles.progressCountNow}>
                  {grantedCriticalCount}
                </Text>
                <Text style={styles.progressCountTotal}>
                  {" "}
                  / {criticalItems.length}
                </Text>
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%` },
                  allCriticalGranted && styles.progressFillDone,
                ]}
              />
            </View>
          </View>
        )}

        {/* ─── 권한 카드 ─── */}
        {status == null ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
          </View>
        ) : (
          PERMISSION_ITEMS.map((item) => {
            const granted = status[item.key];
            return (
              <View
                key={item.key}
                style={[styles.card, granted && styles.cardGranted]}
              >
                <View
                  style={[
                    styles.iconBadge,
                    granted && styles.iconBadgeGranted,
                  ]}
                >
                  <Ionicons
                    name={PERM_ICON[item.key]}
                    size={26}
                    color={
                      granted ? Colors.semantic.success : Colors.brand.primary
                    }
                  />
                </View>

                <View style={styles.cardCenter}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {!item.critical && (
                      <View style={styles.optionalChip}>
                        <Text style={styles.optionalChipText}>선택</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                </View>

                {granted ? (
                  <View style={styles.grantedPill}>
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={Colors.semantic.success}
                    />
                    <Text style={styles.grantedText}>완료</Text>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.allowBtn,
                      pressed && styles.allowBtnPressed,
                    ]}
                    onPress={() => handleAllow(item.key)}
                    disabled={busyKey === item.key}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title} 허용하기`}
                  >
                    {busyKey === item.key ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.allowBtnText}>허용</Text>
                    )}
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ─── 푸터 ─── */}
      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {!allCriticalGranted && remainingCritical > 0 && (
          <View style={styles.remainingRow}>
            <Ionicons
              name="alert-circle"
              size={18}
              color={Colors.semantic.warning}
            />
            <Text style={styles.remainingText}>
              꼭 필요한 권한 {remainingCritical}가지가 남았어요
            </Text>
          </View>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.doneBtn,
            allCriticalGranted ? styles.doneBtnPrimary : styles.doneBtnGhost,
            pressed && styles.btnPressed,
          ]}
          onPress={goHome}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.doneBtnText,
              allCriticalGranted
                ? styles.doneBtnTextPrimary
                : styles.doneBtnTextGhost,
            ]}
          >
            {allCriticalGranted ? "완료" : "나중에 하기"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },

  // ─── 헤더 ───
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.brand.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: Colors.text.secondary,
    marginTop: 10,
    marginBottom: 20,
  },

  // ─── 진행률 ───
  progressCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  progressTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  progressCount: {
    fontSize: 16,
  },
  progressCountNow: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.brand.primary,
  },
  progressCountTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.disabled,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: Colors.gray[200],
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: Colors.brand.primary,
  },
  progressFillDone: {
    backgroundColor: Colors.semantic.success,
  },

  loading: {
    paddingVertical: 60,
    alignItems: "center",
  },

  // ─── 권한 카드 ───
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardGranted: {
    backgroundColor: Colors.semantic.successBg,
    shadowOpacity: 0,
    elevation: 0,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.brand.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconBadgeGranted: {
    backgroundColor: "#FFFFFF",
  },
  cardCenter: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  optionalChip: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: Colors.gray[200],
  },
  optionalChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  },
  cardDesc: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text.secondary,
    marginTop: 5,
  },

  // ─── 허용 버튼 / 완료 칩 ───
  allowBtn: {
    minWidth: 78,
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: Colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  allowBtnPressed: {
    backgroundColor: Colors.brand.primaryDark,
  },
  allowBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  grantedPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  grantedText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.semantic.success,
    marginLeft: 4,
  },

  // ─── 푸터 ───
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.surface.divider,
    backgroundColor: Colors.surface.background,
  },
  remainingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  remainingText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.semantic.warning,
    marginLeft: 6,
  },
  doneBtn: {
    minHeight: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  doneBtnPrimary: {
    backgroundColor: Colors.brand.primary,
  },
  doneBtnGhost: {
    backgroundColor: Colors.gray[200],
  },
  btnPressed: {
    opacity: 0.7,
  },
  doneBtnText: {
    fontSize: 20,
    fontWeight: "700",
  },
  doneBtnTextPrimary: {
    color: "#FFFFFF",
  },
  doneBtnTextGhost: {
    color: Colors.text.secondary,
  },
});
