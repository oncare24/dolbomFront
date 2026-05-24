// 경고에 연관된 약 이름 칩.
// onPressDrug 있으면 탭 가능(테두리+화살표), 없으면 정적 표시.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./Text";
import { Colors, Radius, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";

interface Props {
  names: string[];
  audience: "elderly" | "guardian";
  onPressDrug?: (name: string) => void;
}

export function DrugNameChips({ names, audience, onPressDrug }: Props) {
  if (!names || names.length === 0) return null;
  const big = audience === "elderly";
  const tappable = !!onPressDrug;
  const fontSize = big ? 16 : 13;
  const chevron = big ? 16 : 14;

  return (
    <View style={styles.row}>
      {names.map((name) => {
        const inner = (
          <>
            <AppText
              variant="caption"
              audience={audience}
              style={[styles.name, { fontSize }]}
            >
              {name}
            </AppText>
            {tappable && (
              <Ionicons
                name="chevron-forward"
                size={chevron}
                color={Colors.semantic.info}
              />
            )}
          </>
        );

        const pad = big
          ? { paddingHorizontal: 12, paddingVertical: 8 }
          : { paddingHorizontal: 8, paddingVertical: 4 };

        return tappable ? (
          <Pressable
            key={name}
            onPress={() => {
              haptic.light();
              onPressDrug!(name);
            }}
            android_ripple={{ color: Colors.gray[100] }}
            accessibilityRole="button"
            accessibilityLabel={`${name} 보기`}
            style={[styles.chip, styles.chipTappable, pad]}
          >
            {inner}
          </Pressable>
        ) : (
          <View key={name} style={[styles.chip, pad]}>
            {inner}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radius.md,
    backgroundColor: Colors.semantic.infoBg,
  },
  chipTappable: {
    borderWidth: 1,
    borderColor: Colors.semantic.info,
  },
  name: {
    fontWeight: "700",
    color: Colors.semantic.info,
  },
});
