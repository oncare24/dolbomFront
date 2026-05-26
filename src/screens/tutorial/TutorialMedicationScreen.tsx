// [튜토리얼] 복약 — "약 추가" 화면 mock.
// 실제 약 추가 화면을 흉내 낸 연습용 화면.
// 차이점:
//   1) 약 정보(이름·시간·주기·기간)가 예시 값으로 미리 채워져 있음 (입력 단계 생략 — 간략 버전)
//   2) "저장" 버튼만 빨간 테두리로 강조
//   3) TutorialHintBubble 로 음성+텍스트 안내
//   4) "저장"을 눌러도 실제 등록은 안 함 (연습용) → 완료 화면(TutorialComplete)으로 이동
//
// 진입: ElderlySettings > "약 챙기기 연습"

import React, { useState } from "react";
import { Pressable, StatusBar, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { ScreenContainer } from "../../components/common/Layout";
import { AppHeader } from "../../components/common/Header";
import { AppText } from "../../components/common/Text";
import { TutorialHintBubble } from "../../components/tutorial/TutorialHintBubble";
import { TUTORIAL_HINTS } from "../../constants/tutorialMocks";
import { Colors, Radius, Spacing, Touch } from "../../theme";
import type { RootStackParamList } from "../../types/navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "TutorialMedication">;

// 연습용 예시 값 (실제 입력/등록 아님)
const MOCK_NAME = "혈압약";
const MOCK_TIME = "오전 8:00";

export default function TutorialMedicationScreen() {
  const navigation = useNavigation<Nav>();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (saved) return;
    setSaved(true);
    // 연습용 — 실제 등록은 하지 않고, 저장된 모습만 잠깐 보여준 뒤 완료 화면으로
    setTimeout(() => {
      navigation.navigate("TutorialComplete", { topic: "medication" });
    }, 1400);
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <View style={{ flex: 1 }}>
        <AppHeader title="약 추가" audience="elderly" />

        <ScreenContainer audience="elderly" scrollable paddingTop={Spacing.md}>
          {/* 약 이름 */}
          <View style={styles.section}>
            <AppText variant="bodyBold" audience="elderly" color="primary">
              약 이름
            </AppText>
            <View style={styles.field}>
              <AppText variant="body" audience="elderly" color="primary">
                {MOCK_NAME}
              </AppText>
            </View>
          </View>

          {/* 복용 시간 */}
          <View style={styles.section}>
            <AppText variant="bodyBold" audience="elderly" color="primary">
              복용 시간
            </AppText>
            <View style={styles.timeChip}>
              <Ionicons
                name="time-outline"
                size={22}
                color={Colors.brand.primary}
              />
              <AppText variant="body" audience="elderly" color="primary">
                {MOCK_TIME}
              </AppText>
            </View>
          </View>

          {/* 복용 주기 */}
          <View style={styles.section}>
            <AppText variant="bodyBold" audience="elderly" color="primary">
              복용 주기
            </AppText>
            <View style={styles.toggleRow}>
              <View style={[styles.toggle, styles.toggleOn]}>
                <AppText
                  variant="bodyBold"
                  audience="elderly"
                  style={styles.toggleOnText}
                >
                  매일
                </AppText>
              </View>
              <View style={styles.toggle}>
                <AppText variant="body" audience="elderly" color="secondary">
                  요일 지정
                </AppText>
              </View>
            </View>
          </View>

          {/* 복용 기간 */}
          <View style={styles.section}>
            <AppText variant="bodyBold" audience="elderly" color="primary">
              복용 기간
            </AppText>
            <View style={styles.toggleRow}>
              <View style={[styles.toggle, styles.toggleOn]}>
                <AppText
                  variant="bodyBold"
                  audience="elderly"
                  style={styles.toggleOnText}
                >
                  계속 복용
                </AppText>
              </View>
              <View style={styles.toggle}>
                <AppText variant="body" audience="elderly" color="secondary">
                  기간 지정
                </AppText>
              </View>
            </View>
          </View>

          {/* 저장 버튼 — 저장 전엔 빨간 테두리로 강조 */}
          <Pressable
            onPress={handleSave}
            disabled={saved}
            style={({ pressed }) => [
              styles.saveBtn,
              saved ? styles.saveBtnDone : styles.saveBtnActive,
              !saved && styles.saveBtnHighlight,
              pressed && !saved && styles.saveBtnPressed,
            ]}
          >
            {saved && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={Colors.text.inverse}
                style={styles.saveBtnIcon}
              />
            )}
            <AppText
              variant="bodyBold"
              audience="elderly"
              style={styles.saveBtnText}
            >
              {saved ? "저장됨" : "저장"}
            </AppText>
          </Pressable>

          {/* HintBubble 가리지 않도록 하단 여백 */}
          <View style={styles.bottomSpacer} />
        </ScreenContainer>

        <TutorialHintBubble
          text={
            saved ? TUTORIAL_HINTS.medication_done : TUTORIAL_HINTS.medication
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  field: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: Touch.comfortable,
    justifyContent: "center",
  },
  timeChip: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: Touch.comfortable,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.lg,
    padding: 4,
    gap: 4,
  },
  toggle: {
    flex: 1,
    minHeight: Touch.comfortable,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOn: {
    backgroundColor: Colors.brand.primaryLight,
  },
  toggleOnText: {
    color: Colors.brand.primary,
  },
  saveBtn: {
    minHeight: Touch.senior,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  saveBtnActive: {
    backgroundColor: Colors.brand.primary,
  },
  saveBtnDone: {
    backgroundColor: Colors.semantic.success,
  },
  saveBtnHighlight: {
    borderWidth: 4,
    borderColor: Colors.semantic.danger,
  },
  saveBtnPressed: {
    opacity: 0.8,
  },
  saveBtnIcon: {
    marginRight: 2,
  },
  saveBtnText: {
    color: Colors.text.inverse,
  },
  bottomSpacer: {
    height: 180,
  },
});
