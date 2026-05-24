// 시니어용 처방 약 카드.
// - 약 이름을 메인(큰 글씨) — 약을 한눈에 구분 (효능은 같은 분류가 많아 구분이 안 됨)
// - 효능은 서브(작은 글씨)
// - 왼쪽: 약 사진(imageUrl) / 없으면 약통 아이콘
// - 같은 약 그룹화 → "2번 처방받았어요" / 처방기관 여러 곳이면 "외 N곳"

import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Elevation, Radius, Spacing } from "../../theme";
import { cleanField, formatDosage } from "../../utils/prescription";
import type { PrescriptionGroup } from "../../utils/prescription";

interface Props {
  group: PrescriptionGroup;
}

export function PrescriptionCardElderly({ group }: Props) {
  const p = group.prescription;
  const drugName = cleanField(p.resDrugName);
  const effect = cleanField(p.resPrescribeDrugEffect);
  const dosage = formatDosage(p);
  const orgs = group.organizations;
  const orgLabel =
    orgs.length > 1 ? `${orgs[0]} 외 ${orgs.length - 1}곳` : orgs[0] ?? "";
  const hasEffect = effect.length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          {p.imageUrl ? (
            <Image
              source={{ uri: p.imageUrl }}
              style={styles.pillImage}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="medkit" size={32} color={Colors.brand.primary} />
          )}
        </View>

        <View style={styles.content}>
          {/* 메인: 약 이름 */}
          <AppText variant="h3" audience="elderly">
            {drugName}
          </AppText>

          {/* 서브: 효능 */}
          {hasEffect && (
            <AppText
              variant="caption"
              audience="elderly"
              color="secondary"
              style={styles.effect}
            >
              {effect}
            </AppText>
          )}

          {/* 처방 횟수 (2회 이상만) */}
          {group.count > 1 && (
            <View style={styles.countBadge}>
              <AppText
                variant="caption"
                audience="elderly"
                style={styles.countText}
              >
                {group.count}번 처방받았어요
              </AppText>
            </View>
          )}

          {/* 복용법 */}
          <AppText variant="bodyBold" audience="elderly" style={styles.dosage}>
            {dosage}
          </AppText>

          {/* 처방기관 */}
          {orgLabel.length > 0 && (
            <View style={styles.orgRow}>
              <Ionicons
                name="business-outline"
                size={18}
                color={Colors.text.secondary}
              />
              <AppText
                variant="body"
                audience="elderly"
                color="secondary"
                style={styles.org}
              >
                {orgLabel}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Elevation.sm,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: Colors.brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pillImage: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.lg,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  effect: {
    marginTop: -2,
  },
  countBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  countText: {
    color: Colors.text.secondary,
  },
  dosage: {
    marginTop: Spacing.xs,
  },
  orgRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  org: {
    flex: 1,
  },
});
