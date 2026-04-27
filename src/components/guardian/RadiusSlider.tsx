// 반경 슬라이더 (200~1000m, 100m 단위 스냅).
// 좌측 라벨 + 슬라이더 + 우측 현재값.

import React from "react";
import { StyleSheet, View } from "react-native";
import Slider from "@react-native-community/slider";
import { AppText } from "../common/Text";
import { Colors, Spacing } from "../../theme";
import { haptic } from "../../utils/haptics";
import {
  SAFETY_ZONE_MIN_RADIUS,
  SAFETY_ZONE_MAX_RADIUS,
} from "../../types/safetyZone";

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function RadiusSlider({ value, onChange }: Props) {
  // 슬라이딩 종료 시점에 햅틱 한 번
  const handleComplete = (val: number) => {
    haptic.light();
    onChange(snap(val));
  };

  // 100m 단위로 스냅
  const snap = (v: number) => Math.round(v / 100) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <AppText variant="bodyBold" audience="guardian" color="primary">
          반경
        </AppText>
        <AppText variant="bodyBold" audience="guardian" color="link">
          {value}m
        </AppText>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={SAFETY_ZONE_MIN_RADIUS}
        maximumValue={SAFETY_ZONE_MAX_RADIUS}
        step={100}
        value={value}
        onValueChange={(v) => onChange(snap(v))}
        onSlidingComplete={handleComplete}
        minimumTrackTintColor={Colors.brand.primary}
        maximumTrackTintColor={Colors.gray[300]}
        thumbTintColor={Colors.brand.primary}
      />

      <View style={styles.scaleRow}>
        <AppText variant="caption" audience="guardian" color="secondary">
          {SAFETY_ZONE_MIN_RADIUS}m
        </AppText>
        <AppText variant="caption" audience="guardian" color="secondary">
          {SAFETY_ZONE_MAX_RADIUS}m
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: Spacing.xs,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  scaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: -4,
  },
});
