// 핀이 화면 정중앙에 고정되는 지도 (Uber 픽업 패턴).
// 사용자가 지도를 드래그하면 카메라가 움직이고, 핀 아래 좌표를 부모에 전달.
// 안전구역 원이 핀 따라 같이 움직임.
//
// 성능: 카메라 변경 콜백이 60fps로 들어와서 React 리렌더가 폭주하므로,
//       250ms 디바운스로 카메라 정지 시점만 부모에 알린다 (시중 앱 onCameraIdle 패턴).
//       또한 React.memo로 부모 다른 state 변경 시 지도 리렌더 차단.

import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import {
  NaverMapView,
  NaverMapCircleOverlay,
} from "@mj-studio/react-native-naver-map";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Elevation } from "../../theme";
import { getZoneVisual } from "../../utils/safetyZoneIcon";
import type { SafetyZoneType } from "../../types/safetyZone";

interface Props {
  centerLat: number;
  centerLng: number;
  radius: number;
  zoneType: SafetyZoneType;
  onCenterChanged: (lat: number, lng: number) => void;
}

export interface CenteredPinMapHandle {
  /** 외부에서 카메라 강제 이동 (예: 현재 위치 가져오기 버튼) */
  moveTo: (lat: number, lng: number) => void;
}

// 카메라 정지 판정 디바운스 (시중 앱 onCameraIdle 흉내)
const CAMERA_IDLE_DEBOUNCE_MS = 250;

// 반투명 원 색상
function getCircleFill(type: SafetyZoneType): string {
  switch (type) {
    case "home":
      return "rgba(45, 108, 223, 0.15)";
    case "senior_center":
      return "rgba(198, 98, 0, 0.15)";
    case "hospital":
      return "rgba(183, 28, 28, 0.15)";
    case "custom":
      return "rgba(117, 117, 117, 0.15)";
  }
}

const CenteredPinMapInner = forwardRef<CenteredPinMapHandle, Props>(
  ({ centerLat, centerLng, radius, zoneType, onCenterChanged }, ref) => {
    const mapRef = useRef<any>(null);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const visual = getZoneVisual(zoneType);

    useImperativeHandle(ref, () => ({
      moveTo: (lat, lng) => {
        mapRef.current?.animateCameraTo({
          latitude: lat,
          longitude: lng,
          zoom: 16,
          duration: 500,
        });
      },
    }));

    // 언마운트 시 타이머 정리
    useEffect(() => {
      return () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      };
    }, []);

    // 카메라 변경 → 디바운스로 정지 시점만 부모에 전달
    const handleCameraChanged = (args: {
      latitude: number;
      longitude: number;
    }) => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        onCenterChanged(args.latitude, args.longitude);
      }, CAMERA_IDLE_DEBOUNCE_MS);
    };

    return (
      <View style={styles.container}>
        <NaverMapView
          ref={mapRef}
          style={styles.map}
          initialCamera={{
            latitude: centerLat,
            longitude: centerLng,
            zoom: 16,
          }}
          isShowLocationButton={false}
          isShowCompass={false}
          isShowScaleBar={false}
          minZoom={12}
          maxZoom={19}
          onCameraChanged={handleCameraChanged}
        >
          <NaverMapCircleOverlay
            latitude={centerLat}
            longitude={centerLng}
            radius={radius}
            color={getCircleFill(zoneType)}
            outlineColor={visual.iconColor}
            outlineWidth={2}
          />
        </NaverMapView>

        {/* 화면 정중앙에 고정된 핀 */}
        <View pointerEvents="none" style={styles.pinWrap}>
          <View
            style={[
              styles.pinShadow,
              { backgroundColor: visual.iconColor + "40" },
            ]}
          />
          <View style={[styles.pin, { backgroundColor: visual.iconColor }]}>
            <Ionicons name={visual.iconName} size={20} color="#FFFFFF" />
          </View>
        </View>
      </View>
    );
  },
);

CenteredPinMapInner.displayName = "CenteredPinMap";

// React.memo로 감싸서 부모의 다른 state(이름/주소 입력 등) 변경 시 리렌더 방지
export const CenteredPinMap = memo(CenteredPinMapInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: Colors.gray[200],
  },
  map: {
    flex: 1,
  },
  pinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -40,
    alignItems: "center",
  },
  pin: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    ...Elevation.md,
  },
  pinShadow: {
    position: "absolute",
    bottom: -2,
    width: 16,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
  },
});
