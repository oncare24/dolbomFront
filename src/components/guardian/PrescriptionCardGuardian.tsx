// 보호자용 처방 약 카드 — 컴팩트(정보 밀도 높음).
// - 약 이름 메인 + 효능 작은 뱃지 + 복용법/기관 메타
// - 왼쪽: 약 사진(imageUrl) / 없으면 약통 아이콘

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
        {p.imageUrl ? (
          <Image
            source={{ uri: p.imageUrl }}
            style={styles.pillImage}
            resizeMode="contain"
          />
        ) : (
          <Ionicons name="medkit" size={20} color={Colors.brand.primary} />
        )}
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
    overflow: "hidden",
  },
  pillImage: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.md,
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
