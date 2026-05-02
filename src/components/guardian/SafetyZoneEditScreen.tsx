// 안전구역 추가/수정 화면.
//
// 키보드 처리: KeyboardAwareScrollView가 입력창 위로 자동 스크롤,
//           mapSection flexShrink:0이 NaverMap 재measure 차단.
//           카카오T/우버 표준 패턴.

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Keyboard, StatusBar, StyleSheet, View } from "react-native";
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

import {
  useSafetyZones,
  useCreateSafetyZone,
  useUpdateSafetyZone,
  useDeleteSafetyZone,
} from "../../hooks/useSafetyZones";
import {
  SAFETY_ZONE_MIN_RADIUS,
  type SafetyZoneType,
} from "../../types/safetyZone";
import { Colors, Spacing, Radius } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AddressSearchModal } from "./AddressSearchModal";
import type { KakaoPlace } from "../../services/kakaoSearchService";
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

  // 수정 모드면 목록 캐시에서 해당 zone 찾기 (별도 단건 호출 X)
  const { data: zones } = useSafetyZones(protegeId);
  const existingZone = useMemo(
    () => (isEditMode ? zones?.find((z) => z.id === zoneId) : undefined),
    [isEditMode, zoneId, zones],
  );

  // Mutations
  const createMutation = useCreateSafetyZone();
  const updateMutation = useUpdateSafetyZone();
  const deleteMutation = useDeleteSafetyZone();

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
  // 카카오 검색 모달 표시 여부
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const handleCenterChanged = useCallback((lat: number, lng: number) => {
    setCenter({ latitude: lat, longitude: lng });
  }, []);

  // 카카오 검색 결과 선택 시: 주소·좌표 자동 채움 + 지도 자동 이동
  const handlePlaceSelected = (place: KakaoPlace) => {
    const displayAddress = place.roadAddressName ?? place.addressName;
    setAddress(displayAddress);
    setCenter({ latitude: place.latitude, longitude: place.longitude });
    mapRef.current?.moveTo(place.latitude, place.longitude);
    if (addressError) setAddressError("");
    setSearchModalVisible(false);

    // 이름 비어있으면 장소명을 기본값으로 채움 (시니어 친화 — 한 번 더 입력 안 해도 됨)
    if (name.trim().length === 0) {
      // 20자 제한 준수
      setName(place.placeName.slice(0, 20));
    }
  };

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

  const handleSave = () => {
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      type,
      address: address.trim(),
      latitude: center.latitude,
      longitude: center.longitude,
      radius,
    };

    if (isEditMode && zoneId !== undefined) {
      updateMutation.mutate(
        { id: zoneId, input: payload },
        {
          onSuccess: () => {
            toast.show({
              message: "안전구역을 수정했어요",
              variant: "success",
            });
            navigation.goBack();
          },
          onError: (err: any) => {
            toast.show({
              message: err?.message ?? "저장에 실패했어요",
              variant: "error",
            });
          },
        },
      );
    } else {
      createMutation.mutate(
        { protegeId, ...payload },
        {
          onSuccess: () => {
            toast.show({
              message: "안전구역을 등록했어요",
              variant: "success",
            });
            navigation.goBack();
          },
          onError: (err: any) => {
            // S002 LIMIT 등 백엔드 에러 메시지 그대로 노출
            toast.show({
              message: err?.message ?? "등록에 실패했어요",
              variant: "error",
            });
          },
        },
      );
    }
  };

  const handleDelete = () => {
    if (!isEditMode || zoneId === undefined) return;
    Alert.alert(
      "안전구역 삭제",
      `'${existingZone?.name}'을(를) 삭제하시겠습니까?\n삭제하면 더 이상 이탈 알림을 받을 수 없어요.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(
              { id: zoneId, protegeId },
              {
                onSuccess: () => {
                  toast.show({
                    message: "안전구역을 삭제했어요",
                    variant: "info",
                  });
                  navigation.goBack();
                },
                onError: (err: any) => {
                  toast.show({
                    message: err?.message ?? "삭제에 실패했어요",
                    variant: "error",
                  });
                },
              },
            );
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

      {/* 지도: flexShrink: 0 — 키보드 떠도 줄어들지 않음 */}
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

      {/* 폼 */}
      <KeyboardAwareScrollView
        style={styles.form}
        contentContainerStyle={[
          styles.formContent,
          { paddingBottom: Spacing.xxl + insets.bottom },
        ]}
        keyboardShouldPersistTaps="always"
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
          <AppText
            variant="bodyBold"
            audience="guardian"
            color="primary"
            style={styles.label}
          >
            주소
          </AppText>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setSearchModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.addressTrigger,
              pressed && { backgroundColor: Colors.gray[100] },
              !!addressError && styles.addressTriggerError,
            ]}
            android_ripple={{ color: Colors.gray[200] }}
            accessibilityRole="button"
            accessibilityLabel={
              address
                ? `현재 주소: ${address}. 변경하려면 누르세요`
                : "주소 검색"
            }
          >
            <Ionicons
              name="search"
              size={20}
              color={address ? Colors.brand.primary : Colors.text.secondary}
              style={{ marginRight: Spacing.sm }}
            />
            <AppText
              variant="body"
              audience="guardian"
              color={address ? "primary" : "disabled"}
              numberOfLines={2}
              style={{ flex: 1 }}
            >
              {address || "장소·주소·건물명 검색"}
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.gray[400]}
            />
          </Pressable>
          {!!addressError && (
            <AppText
              variant="caption"
              audience="guardian"
              color="danger"
              style={{ marginTop: Spacing.xs }}
            >
              {addressError}
            </AppText>
          )}
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
              loading={isDeleting}
              audience="guardian"
              style={styles.deleteBtn}
            />
          )}
        </View>
      </KeyboardAwareScrollView>
      {/* 검색 모달 */}
      <AddressSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelect={handlePlaceSelected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  // flexShrink: 0 — 키보드 뜰 때 지도 영역이 줄어들지 않도록 고정
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
  addressTrigger: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface.card,
    borderWidth: 1.5,
    borderColor: Colors.surface.divider,
    borderRadius: Radius.md,
  },
  addressTriggerError: {
    borderColor: Colors.semantic.danger,
  },
});
