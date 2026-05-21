// 메인 액션 3개. SOS는 가로 강조, 병원/약은 정사각형 2열.
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

      <View style={styles.row}>
        <HomeActionCard
          icon="medkit"
          title="병원 찾기"
          description="병원과 가는 길"
          onPress={() => onActionPress("hospital")}
        />
        <HomeActionCard
          icon="fitness"
          title="복약 일정"
          description="약 추가와 일정"
          onPress={() => onActionPress("medication")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
});
