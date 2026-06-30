// 메인 액션. SOS와 복약 일정 모두 가로 강조 카드.
// 라이팅: 명사형 / 친숙한 한자어 / 5~12자 이내 (토스 TDS 가이드 준수).

import React from "react";
import { StyleSheet, View } from "react-native";
import { HomeActionCard } from "./HomeActionCard";
import { Spacing } from "../../theme";
import type { ElderlyHomeAction } from "../../types/elderlyHome";

interface Props {
  onActionPress: (action: ElderlyHomeAction) => void;
}

export function HomeActionGrid({ onActionPress }: Props) {
  return (
    <View style={styles.container}>
      <HomeActionCard
        icon="alert-circle"
        title="긴급 호출"
        description="보호자에게 즉시 알림"
        variant="danger"
        layout="horizontal"
        onPress={() => onActionPress("sos")}
      />

      <HomeActionCard
        icon="fitness"
        title="복약 일정"
        description="약 추가와 일정"
        layout="horizontal"
        onPress={() => onActionPress("medication")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
});
