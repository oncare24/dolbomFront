// 보살핌 - 컴포넌트 검증용 임시 화면
// 발표 후 실제 화면 (로그인/메인/길안내 등) 연결 시점에 이 파일 통째로 교체 예정.

import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, ScrollView } from "react-native";

import {
  PrimaryButton,
  SecondaryButton,
  DangerButton,
} from "./src/components/common/Button";
import { AppText } from "./src/components/common/Text";
import { AppTextInput } from "./src/components/common/Input";

import { Colors } from "./src/theme/colors";
import { Spacing } from "./src/theme/spacing";

export default function App() {
  // 입력창 테스트용 state (검증 후 삭제)
  const [testName, setTestName] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testPassword, setTestPassword] = useState("");
  const [testWithError, setTestWithError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── 페이지 타이틀 ─── */}
        <View style={styles.header}>
          <AppText variant="h1" color="primary">
            컴포넌트 검증
          </AppText>
          <AppText variant="caption" color="secondary" style={{ marginTop: 4 }}>
            발표 후 실제 화면으로 교체 예정
          </AppText>
        </View>

        {/* ─── 버튼 테스트 ─── */}
        <View style={styles.section}>
          <AppText variant="h2" color="primary" style={styles.sectionTitle}>
            버튼
          </AppText>

          <View style={{ gap: Spacing.sm }}>
            <PrimaryButton
              label="병원 추천받기"
              onPress={() => alert("primary 눌림")}
            />
            <SecondaryButton
              label="취소"
              onPress={() => alert("secondary 눌림")}
            />
            <DangerButton
              label="긴급 호출"
              onPress={() => alert("danger 눌림")}
            />
          </View>
        </View>

        {/* ─── 입력창 테스트 ─── */}
        <View style={styles.section}>
          <AppText variant="h2" color="primary" style={styles.sectionTitle}>
            입력창
          </AppText>

          <View style={{ gap: Spacing.md }}>
            <AppTextInput
              label="이름"
              value={testName}
              onChangeText={setTestName}
              placeholder="홍길동"
              helperText="실명을 입력해주세요"
            />

            <AppTextInput
              label="전화번호"
              value={testPhone}
              onChangeText={setTestPhone}
              placeholder="010-0000-0000"
              keyboardType="phone-pad"
              maxLength={13}
            />

            <AppTextInput
              label="비밀번호"
              value={testPassword}
              onChangeText={setTestPassword}
              placeholder="6자 이상"
              secureTextEntry
            />

            <AppTextInput
              label="에러 테스트"
              value={testWithError}
              onChangeText={setTestWithError}
              placeholder="아무거나 입력 후 아래 버튼"
              error={errorMsg}
            />

            <PrimaryButton
              label={errorMsg ? "에러 해제" : "에러 트리거 (흔들림 확인)"}
              onPress={() => {
                setErrorMsg(errorMsg ? "" : "잘못된 형식입니다");
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.background, // 흰색 (시니어 화면 표준)
  },
  scrollContent: {
    paddingHorizontal: Spacing.md, // 16dp
    paddingTop: Spacing.lg, // 24dp
    paddingBottom: Spacing.xxxl, // 64dp (하단 여유)
  },
  header: {
    marginBottom: Spacing.xl, // 32dp
  },
  section: {
    marginBottom: Spacing.xl, // 32dp
  },
  sectionTitle: {
    marginBottom: Spacing.md, // 16dp
  },
});
