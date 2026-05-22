// 보호자용 처방 약 카드 — Apple Health / Medisafe 컴팩트 패턴.
// 시니어 카드보다 정보 밀도 높음:
// - 약 이름이 메인 (보호자는 약 이름으로 의사·약사와 소통)
// - 효능 작은 뱃지
// - 처방 횟수, 복용법, 처방기관 한 줄 메타

import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import { cleanField, formatDosage } from "../../utils/prescription";
import type { PrescriptionGroup } from "../../utils/prescription";

interface Props {
  group: PrescriptionGroup;
}

export function PrescriptionCardGuardian({ group }: Props) {
  const p = group.prescription;
  const drugName = cleanField(p.resDrugName);
  const effect = cleanField(p.resPrescribeDrugEffect);
  const dosage = formatDosage(p);
  const orgs = group.organizations;
  const orgLabel =
    orgs.length > 1 ? `${orgs[0]} 외 ${orgs.length - 1}곳` : orgs[0] ?? "";

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="medkit" size={20} color={Colors.brand.primary} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <AppText
            variant="bodyBold"
            audience="guardian"
            style={styles.name}
            numberOfLines={1}
          >
            {drugName}
          </AppText>
          {group.count > 1 && (
            <View style={styles.countBadge}>
              <AppText
                variant="caption"
                audience="guardian"
                style={styles.countText}
              >
                {group.count}회
              </AppText>
            </View>
          )}
        </View>

        {effect.length > 0 && (
          <View style={styles.effectRow}>
            <View style={styles.effectBadge}>
              <AppText
                variant="caption"
                audience="guardian"
                style={styles.effectText}
                numberOfLines={1}
              >
                {effect}
              </AppText>
            </View>
          </View>
        )}

        <View style={styles.metaRow}>
          <Ionicons
            name="time-outline"
            size={12}
            color={Colors.text.secondary}
          />
          <AppText
            variant="caption"
            audience="guardian"
            color="secondary"
            style={styles.metaText}
          >
            {dosage}
          </AppText>
        </View>

        {orgLabel.length > 0 && (
          <View style={styles.metaRow}>
            <Ionicons
              name="business-outline"
              size={12}
              color={Colors.text.secondary}
            />
            <AppText
              variant="caption"
              audience="guardian"
              color="secondary"
              style={styles.metaText}
              numberOfLines={1}
            >
              {orgLabel}
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Elevation.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  name: {
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  countText: {
    color: Colors.text.secondary,
    fontSize: 11,
  },
  effectRow: {
    flexDirection: "row",
    marginTop: 2,
  },
  effectBadge: {
    backgroundColor: Colors.brand.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  effectText: {
    color: Colors.brand.primary,
    fontSize: 11,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    flex: 1,
  },
});
