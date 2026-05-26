// [튜토리얼] 복약 — "오늘의 약" 빈 화면 mock. 복약 튜토리얼 2단계.
// 실제 MedicationTodayScreen 의 빈 상태(MedicationTodayEmpty)를 흉내 냄.
// 차이점:
//   1) "복약 일정 추가하기" 버튼만 빨간 테두리로 강조
//   2) HintBubble로 음성+텍스트 안내
//   3) 버튼 탭 → TutorialMedication(약 추가 화면)으로 이동

import React from "react";
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

type Nav = NativeStackNavigationProp<
  RootStackParamList,
  "TutorialMedicationToday"
>;

export default function TutorialMedicationTodayScreen() {
  const navigation = useNavigation<Nav>();

  const handleAdd = () => {
    navigation.navigate("TutorialMedication");
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface.background}
      />
      <View style={{ flex: 1 }}>
        <AppHeader title="오늘의 약" audience="elderly" />

        <ScreenContainer audience="elderly" scrollable paddingTop={Spacing.md}>
          <View style={styles.emptyWrap}>
            <View style={styles.iconWrap}>
              <Ionicons
                name="medkit-outline"
                size={64}
                color={Colors.text.disabled}
              />
            </View>
            <AppText
              variant="h3"
              audience="elderly"
              color="primary"
              style={styles.title}
            >
              등록된 약이 없어요
            </AppText>
            <AppText
              variant="body"
              audience="elderly"
              color="secondary"
              style={styles.desc}
            >
              아래 버튼을 눌러 약을 추가해보세요
            </AppText>

            {/* ⭐ 강조 대상 — "복약 일정 추가하기" 버튼 */}
            <Pressable
              onPress={handleAdd}
              style={({ pressed }) => [
                styles.addBtn,
                styles.addBtnHighlight,
                pressed && styles.addBtnPressed,
              ]}
            >
              <Ionicons name="add" size={26} color={Colors.text.inverse} />
              <AppText variant="bodyBold" audience="elderly" color="inverse">
                복약 일정 추가하기
              </AppText>
            </Pressable>
          </View>

          <View style={styles.bottomSpacer} />
        </ScreenContainer>

        <TutorialHintBubble text={TUTORIAL_HINTS.medication_today} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  emptyWrap: {
    alignItems: "center",
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  desc: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.xl,
    minHeight: Touch.senior,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  addBtnHighlight: {
    borderWidth: 4,
    borderColor: Colors.semantic.danger,
  },
  addBtnPressed: {
    opacity: 0.8,
  },
  bottomSpacer: {
    height: 180,
  },
});
