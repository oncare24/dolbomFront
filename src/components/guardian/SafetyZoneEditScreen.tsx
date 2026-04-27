// 안전구역 추가/수정 화면.
//
// 키보드 처리: KeyboardAwareScrollView가 입력창 위로 자동 스크롤,
//           mapSection flexShrink:0이 NaverMap 재measure 차단.
//           카카오T/우버 표준 패턴.

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, StatusBar, StyleSheet, View } from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import * as Location from "expo-location";

import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { AppTextInput } from "../../components/common/Input";
import {
  PrimaryButton,
  DangerButton,
  SecondaryButton,
} from "../../components/common/Button";
import { useToast } from "../../components/common/Toast";
import {
  CenteredPinMap,
  type CenteredPinMapHandle,
} from "../../components/guardian/CenteredPinMap";
import { RadiusSlider } from "../../components/guardian/RadiusSlider";
import { ZoneTypePicker } from "../../components/guardian/ZoneTypePicker";

import { MOCK_SAFETY_ZONES } from "../../mocks/safetyZoneMock";
import {
  SAFETY_ZONE_MIN_RADIUS,
  type SafetyZoneType,
} from "../../types/safetyZone";
import { Colors, Spacing } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";

type Route = RouteProp<RootStackParamList, "SafetyZoneEdit">;
type Nav = NativeStackNavigationProp<RootStackParamList, "SafetyZoneEdit">;

const DEFAULT_CENTER = { latitude: 35.335, longitude: 129.0386 };

export default function SafetyZoneEditScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const mapRef = useRef<CenteredPinMapHandle>(null);

  const { protegeId, zoneId } = route.params;
  const isEditMode = zoneId !== undefined;

  const existingZone = useMemo(
    () =>
      isEditMode ? MOCK_SAFETY_ZONES.find((z) => z.id === zoneId) : undefined,
    [isEditMode, zoneId],
  );

  const [name, setName] = useState(existingZone?.name ?? "");
  const [address, setAddress] = useState(existingZone?.address ?? "");
  const [type, setType] = useState<SafetyZoneType>(
    existingZone?.type ?? "home",
  );
  const [radius, setRadius] = useState(
    existingZone?.radius ?? SAFETY_ZONE_MIN_RADIUS,
  );
  const [center, setCenter] = useState({
    latitude: existingZone?.latitude ?? DEFAULT_CENTER.latitude,
    longitude: existingZone?.longitude ?? DEFAULT_CENTER.longitude,
  });

  const [nameError, setNameError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCenterChanged = useCallback((lat: number, lng: number) => {
    setCenter({ latitude: lat, longitude: lng });
  }, []);

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "위치 권한 필요",
          "현재 위치를 가져오려면 위치 권한이 필요합니다.",
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      mapRef.current?.moveTo(loc.coords.latitude, loc.coords.longitude);
      toast.show({ message: "현재 위치로 이동했어요", variant: "success" });
    } catch (e) {
      toast.show({ message: "위치를 가져오지 못했어요", variant: "error" });
    }
  };

  const validate = (): boolean => {
    let ok = true;
    setNameError("");
    setAddressError("");
    if (name.trim().length === 0) {
      setNameError("안전구역 이름을 입력해주세요");
      ok = false;
    } else if (name.trim().length > 20) {
      setNameError("이름은 20자 이내로 입력해주세요");
      ok = false;
    }
    if (address.trim().length === 0) {
      setAddressError("주소를 입력해주세요");
      ok = false;
    }
    return ok;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      // TODO: 백엔드 연동 시 axios 호출
      await new Promise((r) => setTimeout(r, 800));
      toast.show({
        message: isEditMode ? "안전구역을 수정했어요" : "안전구역을 등록했어요",
        variant: "success",
      });
      navigation.goBack();
    } catch (e) {
      toast.show({ message: "저장에 실패했어요", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "안전구역 삭제",
      `'${existingZone?.name}'을(를) 삭제하시겠습니까?\n삭제하면 더 이상 이탈 알림을 받을 수 없어요.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            // TODO: 백엔드 연동 시 axios DELETE
            await new Promise((r) => setTimeout(r, 500));
            toast.show({ message: "안전구역을 삭제했어요", variant: "info" });
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />

      <View style={{ paddingTop: insets.top }}>
        <AppHeader
          title={isEditMode ? "안전구역 수정" : "안전구역 추가"}
          audience="guardian"
        />
      </View>

      {/* ★ 지도: flexShrink: 0 — 키보드 떠도 줄어들지 않음 */}
      <View style={styles.mapSection}>
        <CenteredPinMap
          ref={mapRef}
          centerLat={center.latitude}
          centerLng={center.longitude}
          radius={radius}
          zoneType={type}
          onCenterChanged={handleCenterChanged}
        />
        <View style={styles.mapHint}>
          <AppText
            variant="caption"
            audience="guardian"
            style={{ color: "#FFFFFF", fontWeight: "600" }}
          >
            지도를 움직여서 위치를 맞춰주세요
          </AppText>
        </View>
        <View style={styles.locationBtnWrap}>
          <SecondaryButton
            label="📍 현재 위치"
            onPress={handleUseCurrentLocation}
            audience="guardian"
            style={styles.locationBtn}
          />
        </View>
      </View>

      {/* ★ 폼: KeyboardAwareScrollView가 자동 스크롤 처리 */}
      <KeyboardAwareScrollView
        style={styles.form}
        contentContainerStyle={[
          styles.formContent,
          { paddingBottom: Spacing.xxl + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={Spacing.lg}
      >
        <View style={styles.field}>
          <AppText
            variant="bodyBold"
            audience="guardian"
            color="primary"
            style={styles.label}
          >
            장소 종류
          </AppText>
          <ZoneTypePicker value={type} onChange={setType} />
        </View>

        <View style={styles.field}>
          <AppTextInput
            label="안전구역 이름"
            placeholder="예: 우리집, 동네 경로당"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (nameError) setNameError("");
            }}
            error={nameError}
            maxLength={20}
            audience="guardian"
          />
        </View>

        <View style={styles.field}>
          <AppTextInput
            label="주소"
            placeholder="예: 경상남도 양산시 중앙로 39"
            value={address}
            onChangeText={(t) => {
              setAddress(t);
              if (addressError) setAddressError("");
            }}
            error={addressError}
            audience="guardian"
          />
        </View>

        <View style={styles.field}>
          <RadiusSlider value={radius} onChange={setRadius} />
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={isEditMode ? "수정 완료" : "안전구역 등록"}
            onPress={handleSave}
            loading={isSaving}
            audience="guardian"
          />
          {isEditMode && (
            <DangerButton
              label="안전구역 삭제"
              onPress={handleDelete}
              audience="guardian"
              style={styles.deleteBtn}
            />
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  // ★ flexShrink: 0 — 키보드 뜰 때 지도 영역이 줄어들지 않도록 고정
  mapSection: {
    height: 280,
    flexShrink: 0,
    position: "relative",
  },
  mapHint: {
    position: "absolute",
    top: Spacing.sm,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
  },
  locationBtnWrap: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.sm,
  },
  locationBtn: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: Spacing.md,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  actions: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  deleteBtn: {
    marginTop: Spacing.xs,
  },
});
