// 안전구역 지도 미리보기.
// 모든 안전구역의 원 + 중심 마커 + 피보호자 현재 위치 마커 표시.
// 카드 탭 시 외부에서 ref로 카메라 이동 가능.

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import {
  NaverMapView,
  NaverMapCircleOverlay,
  NaverMapMarkerOverlay,
} from "@mj-studio/react-native-naver-map";
import { Colors } from "../../theme";
import { getZoneVisual } from "../../utils/safetyZoneIcon";
import type { SafetyZone } from "../../types/safetyZone";

interface Props {
  zones: SafetyZone[];
  currentLocation: { latitude: number; longitude: number } | null;
}

export interface SafetyZoneMapHandle {
  /** 특정 안전구역 위치로 카메라 이동 */
  focusZone: (zone: SafetyZone) => void;
}

// 타입별 원 색상 (반투명)
function getCircleColor(type: SafetyZone["type"]): string {
  const visual = getZoneVisual(type);
  // hex → rgba 변환은 단순화: 미리 정의된 반투명 컬러 매핑
  switch (type) {
    case "home":
      return "rgba(45, 108, 223, 0.15)"; // brand.primary
    case "senior_center":
      return "rgba(198, 98, 0, 0.15)"; // warning
    case "hospital":
      return "rgba(183, 28, 28, 0.15)"; // danger
    case "custom":
      return "rgba(117, 117, 117, 0.15)"; // gray
  }
}

function getOutlineColor(type: SafetyZone["type"]): string {
  return getZoneVisual(type).iconColor;
}

export const SafetyZoneMapPreview = forwardRef<SafetyZoneMapHandle, Props>(
  ({ zones, currentLocation }, ref) => {
    const mapRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      focusZone: (zone) => {
        mapRef.current?.animateCameraTo({
          latitude: zone.latitude,
          longitude: zone.longitude,
          zoom: 16,
          duration: 500,
        });
      },
    }));

    // 초기 카메라: 첫 안전구역 또는 현재 위치
    const initialCenter = zones[0] ??
      currentLocation ?? { latitude: 35.335, longitude: 129.0386 };

    return (
      <View style={styles.container}>
        <NaverMapView
          ref={mapRef}
          style={styles.map}
          initialCamera={{
            latitude: initialCenter.latitude,
            longitude: initialCenter.longitude,
            zoom: 14,
          }}
          isShowLocationButton={false}
          isShowCompass={false}
          isShowScaleBar={false}
          minZoom={10}
          maxZoom={18}
        >
          {/* 안전구역 원 + 중심 마커 */}
          {zones.map((zone) => (
            <React.Fragment key={`zone-${zone.id}`}>
              <NaverMapCircleOverlay
                latitude={zone.latitude}
                longitude={zone.longitude}
                radius={zone.radius}
                color={getCircleColor(zone.type)}
                outlineColor={getOutlineColor(zone.type)}
                outlineWidth={2}
              />
              <NaverMapMarkerOverlay
                latitude={zone.latitude}
                longitude={zone.longitude}
                caption={{
                  text: zone.name,
                  textSize: 12,
                  color: "#000000",
                  haloColor: "#FFFFFF",
                }}
                width={28}
                height={28}
                anchor={{ x: 0.5, y: 0.5 }}
              />
            </React.Fragment>
          ))}

          {/* 피보호자 현재 위치 (파란 점) */}
          {currentLocation && (
            <NaverMapMarkerOverlay
              latitude={currentLocation.latitude}
              longitude={currentLocation.longitude}
              caption={{
                text: "현재 위치",
                textSize: 11,
                color: "#1565C0",
                haloColor: "#FFFFFF",
              }}
              width={20}
              height={20}
              anchor={{ x: 0.5, y: 0.5 }}
            />
          )}
        </NaverMapView>
      </View>
    );
  },
);

SafetyZoneMapPreview.displayName = "SafetyZoneMapPreview";

const styles = StyleSheet.create({
  container: {
    height: 280,
    backgroundColor: Colors.gray[200],
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
});
