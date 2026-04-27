import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { AppText } from "../Text";
import { Colors, Spacing, Radius, Elevation } from "../../../theme";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICON_MAP: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "close-circle",
  info: "information-circle",
  warning: "warning",
};

const COLOR_MAP: Record<ToastVariant, { bg: string; icon: string }> = {
  success: { bg: Colors.semantic.success, icon: Colors.text.inverse },
  error: { bg: Colors.semantic.danger, icon: Colors.text.inverse },
  info: { bg: Colors.semantic.info, icon: Colors.text.inverse },
  warning: { bg: Colors.semantic.warning, icon: Colors.text.inverse },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const hide = useCallback(() => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-20, { duration: 200 });
    setTimeout(() => setToast(null), 220);
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      // 기존 타이머 취소 (연속 호출 시 마지막 토스트가 풀 시간 보장)
      if (hideTimer.current) clearTimeout(hideTimer.current);

      setToast(options);
      opacity.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });

      const duration = options.durationMs ?? 3000;
      hideTimer.current = setTimeout(hide, duration);
    },
    [hide],
  );

  const variant = toast?.variant ?? "info";
  const colors = COLOR_MAP[variant];

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.container,
            { top: insets.top + Spacing.sm, backgroundColor: colors.bg },
            animatedStyle,
          ]}
        >
          <Ionicons
            name={ICON_MAP[variant]}
            size={24}
            color={colors.icon}
            style={styles.icon}
          />
          <AppText
            variant="body"
            style={{ color: Colors.text.inverse, flex: 1 }}
            maxScale={1.3}
            numberOfLines={3}
          >
            {toast.message}
          </AppText>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    ...Elevation.md,
    zIndex: 1000,
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
