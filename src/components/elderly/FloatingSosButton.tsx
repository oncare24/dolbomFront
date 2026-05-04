// 피보호자 메인 화면들에 상시 노출되는 SOS FAB.
//
// 설계 결정:
//   - 화면별로 개별 import (Navigator overlay 방식 대신).
//     → 키보드 영역, 길안내 진행 중처럼 가리면 안 되는 화면에서 손쉽게 제외 가능.
//   - position absolute, 우하단 고정. 인셋(safeArea) 고려.
//   - 시니어 응급 도메인 → 80dp 원형 (Touch.senior=72보다 더 큰 응급 등급).
//   - 빨간색 + warning 아이콘 + 'SOS' 라벨 → 멀리서도 인지 가능.
//   - haptic.heavy로 누름 즉시 강한 피드백 (오발신 막진 못해도 "눌렀다"는 인지 확실).
//   - 실제 호출은 SosScreen에서. 이 FAB는 진입 버튼만.

import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FAB_SIZE = 80;

interface Props {
  /** 우하단 추가 마진. 화면별로 하단에 다른 UI(탭바, 버튼)가 있을 때 조정. 기본 24. */
  bottomOffset?: number;
}

export function FloatingSosButton({ bottomOffset = Spacing.lg }: Props) {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    haptic.heavy();
    navigation.navigate("Sos");
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="긴급 호출 화면 열기"
      android_ripple={{
        color: "rgba(255,255,255,0.25)",
        borderless: true,
        radius: FAB_SIZE / 2,
      }}
      style={({ pressed }) => [
        styles.fab,
        {
          right: Spacing.lg,
          bottom: insets.bottom + bottomOffset,
        },
        pressed && styles.fabPressed,
      ]}
    >
      <Ionicons name="warning" size={32} color={Colors.text.inverse} />
      <AppText variant="caption" color="inverse" style={styles.label}>
        SOS
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: Radius.full,
    backgroundColor: Colors.semantic.danger,
    alignItems: "center",
    justifyContent: "center",
    ...Elevation.lg,
    // 흰 테두리로 배경과 분리감 (지도 등 컬러풀한 배경 위에서도 인지)
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  label: {
    fontWeight: "700",
    marginTop: 2,
  },
});
