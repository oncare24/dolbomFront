// src/components/elderly/MedicationAutoRegisterCard.tsx
// 처방 분석 직후, 자동으로 복약 알림에 추가된 결과를 어머니에게 부드럽게 안내.

import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import type { AutoRegisterResult } from "../../types/drugSafety";

interface Props {
  result: AutoRegisterResult;
}

export function MedicationAutoRegisterCard({ result }: Props) {
  const registered = result.registered?.length ?? 0;
  const skipped = result.skipped?.length ?? 0;

  if (registered === 0 && skipped === 0) return null;

  return (
    <View style={styles.card}>
      <AppText variant="bodyBold" audience="elderly" style={styles.title}>
        {registered > 0
          ? `약 ${registered}개가 복약 알림에 추가됐어요`
          : "복약 알림에 새로 추가된 약은 없어요"}
      </AppText>
      {skipped > 0 && (
        <AppText
          variant="body"
          audience="elderly"
          color="secondary"
          style={styles.sub}
        >
          {skipped}개는 복용 정보가 부족해 보호자가 확인할 거예요
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.xs,
    ...Elevation.sm,
  },
  title: { color: Colors.brand.primary },
  sub: { marginTop: Spacing.xs },
});
