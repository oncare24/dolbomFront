// 안전구역 타입별 아이콘·색상 매핑.

import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme";
import type { SafetyZoneType } from "../types/safetyZone";

interface ZoneVisual {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  label: string;
}

export const ZONE_VISUAL_MAP: Record<SafetyZoneType, ZoneVisual> = {
  home: {
    iconName: "home",
    iconColor: Colors.brand.primary,
    bgColor: Colors.brand.primaryLight,
    label: "집",
  },
  senior_center: {
    iconName: "people",
    iconColor: Colors.semantic.warning,
    bgColor: Colors.semantic.warningBg,
    label: "경로당",
  },
  hospital: {
    iconName: "medkit",
    iconColor: Colors.semantic.danger,
    bgColor: Colors.semantic.dangerBg,
    label: "병원",
  },
  custom: {
    iconName: "location",
    iconColor: Colors.gray[600],
    bgColor: Colors.gray[100],
    label: "기타",
  },
};

export function getZoneVisual(type: SafetyZoneType): ZoneVisual {
  return ZONE_VISUAL_MAP[type];
}
