// 안전구역 타입 선택 (4종). 가로 4개 칩 형태.

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../common/Text";
import { Colors, Spacing, Radius } from "../../theme";
import { haptic } from "../../utils/haptics";
import { ZONE_VISUAL_MAP } from "../../utils/safetyZoneIcon";
import type { SafetyZoneType } from "../../types/safetyZone";

interface Props {
  value: SafetyZoneType;
  onChange: (type: SafetyZoneType) => void;
}

const TYPES: SafetyZoneType[] = ["home", "senior_center", "hospital", "custom"];

export function ZoneTypePicker({ value, onChange }: Props) {
  const handleSelect = (type: SafetyZoneType) => {
    haptic.light();
    onChange(type);
  };

  return (
    <View style={styles.container}>
      {TYPES.map((type) => {
        const visual = ZONE_VISUAL_MAP[type];
        const selected = value === type;

        return (
          <Pressable
            key={type}
            onPress={() => handleSelect(type)}
            android_ripple={{
              color: visual.bgColor,
              borderless: false,
            }}
            accessibilityRole="button"
            accessibilityLabel={`${visual.label} 타입`}
            accessibilityState={{ selected }}
            style={[
              styles.chip,
              selected && {
                backgroundColor: visual.bgColor,
                borderColor: visual.iconColor,
              },
            ]}
          >
            <Ionicons
              name={visual.iconName}
              size={22}
              color={selected ? visual.iconColor : Colors.gray[500]}
            />
            <AppText
              variant="caption"
              audience="guardian"
              style={{
                color: selected ? visual.iconColor : Colors.text.secondary,
                fontWeight: selected ? "600" : "400",
                marginTop: 4,
              }}
            >
              {visual.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.surface.divider,
    backgroundColor: Colors.surface.card,
    minHeight: 64,
  },
});
