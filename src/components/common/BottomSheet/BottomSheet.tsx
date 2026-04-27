import React, { useEffect } from "react";
import { Modal, Pressable, StyleSheet, View, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { AppText } from "../Text";
import { Colors, Spacing, Radius, Elevation } from "../../../theme";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  // dismissable=false면 배경 탭/뒤로가기로 닫히지 않음 (강제 선택 시나리오)
  dismissable?: boolean;
}

/**
 * BottomSheet
 * - 시니어 화면용 하단 모달. 풀스크린 모달보다 친숙하고 컨텍스트 유지에 좋음.
 * - 배경 탭 + 안드로이드 뒤로가기 버튼으로 닫힘 (dismissable=true 기본).
 * - 슬라이드 + 페이드 동시 애니메이션 (220ms).
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  dismissable = true,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(400);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      overlayOpacity.value = withTiming(1, { duration: 220 });
    } else {
      translateY.value = withTiming(400, {
        duration: 180,
        easing: Easing.in(Easing.cubic),
      });
      overlayOpacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible]);

  // Android 뒤로가기 처리
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (dismissable) {
        onClose();
        return true;
      }
      return true; // 강제 모드면 무시
    });
    return () => sub.remove();
  }, [visible, dismissable, onClose]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const handleOverlayPress = () => {
    if (dismissable) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissable ? onClose : undefined}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleOverlayPress}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
            sheetStyle,
          ]}
        >
          <View style={styles.handle} />
          {title && (
            <AppText variant="h2" color="primary" style={styles.title}>
              {title}
            </AppText>
          )}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surface.overlay,
  },
  sheet: {
    backgroundColor: Colors.surface.background,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    ...Elevation.lg,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.gray[300],
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  content: {
    width: "100%",
  },
});
