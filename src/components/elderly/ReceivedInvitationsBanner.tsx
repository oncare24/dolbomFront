// 받은 보호자 연동 요청 배너.
// ElderlyHome 상단(Greeting 아래)에 노출. PENDING 1건 이상일 때만 렌더.
// 시니어 톤: 큰 글씨, 카드 padding lg, 우측 chevron으로 이동성 강조.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Spacing, Radius, Elevation } from "../../theme";
import { haptic } from "../../utils/haptics";

interface Props {
  count: number;
  onPress: () => void;
}

export function ReceivedInvitationsBanner({ count, onPress }: Props) {
  if (count <= 0) return null;

  const handlePress = () => {
    haptic.light();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: Colors.brand.primary, borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={`보호자 연동 요청 ${count}건. 탭하여 확인하세요`}
      style={styles.banner}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="people" size={28} color={Colors.brand.primary} />
      </View>
      <View style={styles.textWrap}>
        <AppText variant="bodyBold" audience="elderly" color="primary">
          보호자 연동 요청 {count}건
        </AppText>
        <AppText
          variant="caption"
          audience="elderly"
          color="secondary"
          style={styles.sub}
        >
          눌러 주세요
        </AppText>
      </View>
      <Ionicons
        name="chevron-forward"
        size={24}
        color={Colors.text.secondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.brand.primaryLight,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Elevation.xs,
    overflow: "hidden",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  sub: {
    marginTop: 2,
  },
});
