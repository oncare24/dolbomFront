// 카카오 장소/주소 검색 모달.
//
// 시중앱 패턴(카카오T 픽업, 토스 송금처): 풀스크린 모달 + 상단 검색창 + 하단 결과 리스트.
// 디바운스 400ms — 타이핑 멈추면 자동 검색.
//
// onSelect: 결과 탭 시 부모로 전달. 부모는 좌표/주소 채우고 지도 이동 + 모달 닫기.

import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "../common/Text";
import { Colors, Spacing, Radius, Touch } from "../../theme";
import { haptic } from "../../utils/haptics";
import { useKakaoSearch } from "../../hooks/useKakaoSearch";
import type { KakaoPlace } from "../../services/kakaoSearchService";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: KakaoPlace) => void;
}

export function AddressSearchModal({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const { data, isLoading, isError } = useKakaoSearch(query);

  const handleSelect = (place: KakaoPlace) => {
    haptic.light();
    onSelect(place);
    setQuery(""); // 다음 진입 시 깨끗한 상태로
  };

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const trimmedQuery = query.trim();
  const showInitialGuide = trimmedQuery.length === 0;
  const showLoading = !showInitialGuide && isLoading;
  const showError = !showInitialGuide && isError;
  const showEmpty =
    !showInitialGuide && !isLoading && !isError && data?.results.length === 0;
  const showResults =
    !showInitialGuide &&
    !isLoading &&
    !isError &&
    (data?.results.length ?? 0) > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* 헤더: 검색창 + 닫기 */}
        <View style={styles.header}>
          <Pressable
            onPress={handleClose}
            style={styles.closeBtn}
            android_ripple={{
              color: Colors.gray[200],
              borderless: true,
              radius: 24,
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="닫기"
          >
            <Ionicons name="close" size={28} color={Colors.text.primary} />
          </Pressable>

          <View style={styles.searchBox}>
            <Ionicons
              name="search"
              size={20}
              color={Colors.text.secondary}
              style={{ marginRight: Spacing.xs }}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="장소·주소·건물명 검색"
              placeholderTextColor={Colors.text.disabled}
              style={styles.searchInput}
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={8}
                style={styles.clearBtn}
                accessibilityRole="button"
                accessibilityLabel="검색어 지우기"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={Colors.gray[400]}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* 본문 */}
        {showInitialGuide && (
          <View style={styles.center}>
            <Ionicons
              name="location-outline"
              size={56}
              color={Colors.gray[300]}
            />
            <AppText
              variant="body"
              audience="guardian"
              color="secondary"
              style={styles.guideText}
            >
              찾으시는 장소나 주소를 입력해주세요
            </AppText>
            <AppText
              variant="caption"
              audience="guardian"
              color="disabled"
              style={styles.guideSub}
            >
              예: 양산역, 삼성병원, 양산시 중앙로 39
            </AppText>
          </View>
        )}

        {showLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
          </View>
        )}

        {showError && (
          <View style={styles.center}>
            <Ionicons
              name="cloud-offline-outline"
              size={48}
              color={Colors.semantic.danger}
            />
            <AppText
              variant="body"
              audience="guardian"
              style={[styles.guideText, { color: Colors.semantic.danger }]}
            >
              검색에 실패했어요
            </AppText>
            <AppText
              variant="caption"
              audience="guardian"
              color="secondary"
              style={styles.guideSub}
            >
              잠시 후 다시 시도해주세요
            </AppText>
          </View>
        )}

        {showEmpty && (
          <View style={styles.center}>
            <Ionicons name="search" size={48} color={Colors.gray[300]} />
            <AppText
              variant="body"
              audience="guardian"
              color="secondary"
              style={styles.guideText}
            >
              검색 결과가 없어요
            </AppText>
            <AppText
              variant="caption"
              audience="guardian"
              color="disabled"
              style={styles.guideSub}
            >
              다른 검색어로 시도해보세요
            </AppText>
          </View>
        )}

        {showResults && data && (
          <FlatList
            data={data.results}
            keyExtractor={(item, idx) =>
              `${item.placeName}-${item.latitude}-${item.longitude}-${idx}`
            }
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.divider} />}
            contentContainerStyle={{
              paddingBottom: insets.bottom + Spacing.lg,
            }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.resultItem,
                  pressed && { backgroundColor: Colors.gray[100] },
                ]}
                android_ripple={{ color: Colors.gray[200] }}
                accessibilityRole="button"
                accessibilityLabel={`${item.placeName} 선택`}
              >
                <Ionicons
                  name="location"
                  size={22}
                  color={Colors.brand.primary}
                  style={styles.resultIcon}
                />
                <View style={styles.resultText}>
                  <AppText
                    variant="bodyBold"
                    audience="guardian"
                    color="primary"
                    numberOfLines={1}
                  >
                    {item.placeName}
                  </AppText>
                  <AppText
                    variant="caption"
                    audience="guardian"
                    color="secondary"
                    numberOfLines={1}
                    style={styles.resultAddress}
                  >
                    {item.roadAddressName ?? item.addressName}
                  </AppText>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.divider,
    gap: Spacing.sm,
  },
  closeBtn: {
    width: Touch.comfortable,
    height: Touch.comfortable,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray[100],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    paddingVertical: 0, // Android에서 TextInput 기본 padding 제거
  },
  clearBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  guideText: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
  guideSub: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface.card,
    minHeight: Touch.comfortable,
  },
  resultIcon: {
    marginRight: Spacing.sm,
  },
  resultText: {
    flex: 1,
  },
  resultAddress: {
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surface.divider,
    marginLeft: Spacing.md + 22 + Spacing.sm, // 아이콘 정렬
  },
});
