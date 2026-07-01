# 변경 이력 (CHANGELOG)

> 이 문서는 **시간순 코드 변경 이력**을 기록한다. 최신 항목이 맨 위.
> 프로젝트 가이드는 `CLAUDE.md`를 본다.
>
> **작성 규칙**: 코드를 수정/추가/삭제하면 작업 단위로 항목을 추가한다. 각 항목은
> `날짜 · 제목` 헤더 아래에 **무엇을/왜/영향 범위(파일·화면·라우트)·검증 결과**를 적는다.
> 날짜는 절대값(YYYY-MM-DD).

---

## 2026-07-01 · 복약 편집 화면 전면 봉지(DoseGroup)화

### 무엇을 / 왜
`MedicationEditScreen` 저장을 평면 CRUD에서 봉지 API로 전면 전환. 시각 이동 시 scheduleId를
보존(복용기록/알람 연속성)하고, AUTO(CODEF 자동) 봉지는 편집을 제한한다.
(앞선 연동 1·2·3단계: 조회 복구 + today 4-2 + 편집 시각이동 4-3 에 이은 마무리.)

### 변경
- `services/medicationService.ts`: `createMedicationGroup`(4-5), `addMedicationPacket`,
  `updateMedicationPacket`(4-4), `deleteMedicationPacket`(4-6), `deleteMedicationGroup`(4-6),
  `renameMedicationGroup` 추가 (`moveMedicationPacketTime`은 기존).
- `hooks/useMedications.ts`: 대응 훅 6개 추가(onSettled에 schedule 목록 + today 무효화).
- `screens/shared/MedicationEditScreen.tsx`: 저장 로직 봉지 API 전환
  - 신규 = `createGroup`, 수정 = 이름 PATCH(MANUAL) / 속성 4-4 / 이동 4-3+속성 / 추가(MANUAL) / 삭제,
    삭제 버튼 = `deleteGroup`.
  - AUTO 봉지: 약 이름 입력 잠금 + 안내, 시각 추가 시 차단(toast).
- 평면 CRUD 훅(`useCreate/Update/DeleteMedicationSchedule`)은 편집 화면에서 미사용(존치).

### 검증
- `npx tsc --noEmit` 통과(무관 기존 에러 2건 제외). 실제 구동은 백엔드 편집 API 배포 후 가능.

---

## 2026-06-30 · 고령자 본인 복약 안전분석(warnings) 진입·UI 제거

작업 브랜치: `chore/remove-hospital-navigation` (아직 커밋 전, 직전 작업에 이어서)

### 배경 / 이유
고령자(elderly) 클라이언트에서 **본인이 CODEF 인증 후 자기 약물 안전분석(warnings)을 보는 진입점과
UI**를 제거. 보호자가 피보호자 분석을 조회/재요청하는 경로와, 백엔드의 CODEF 인증→처방전 조회→
복약 자동등록(`confirmCodefAuth` 트랜잭션) 로직은 **그대로 유지**한다. 백엔드는 손대지 않음.
고령자 흐름(홈 카드 → Intro→Form→Waiting→Result → 처방약 목록)이 인증·자동등록·warnings 표시를
한 동선에 묶고 있어 분리가 불가능하므로, 고령자 동선 전체를 화면에서 제거(백엔드 로직은 보존).

### 삭제 (16개 파일)
- **자가 분석 화면**: `screens/elderly/{MedicationAnalysisIntro,MedicationAnalysisForm,MedicationAnalysisWaiting,MedicationAnalysisResult,PrescriptionList}Screen.tsx`
- **홈 진입 카드 + Result 전용 컴포넌트**: `components/elderly/{HomeMedicationAnalysisCard,HeroStatusCard,MedicationAutoRegisterCard,AnalysisDisclaimerNote,AnalysisEmptyView,PrescriptionEntryCard,WarningCardCritical,WarningCardSimple,PrescriptionCardElderly}.tsx`
- **상태/스키마**: `stores/drugSafetyAuthStore.ts`, `schemas/drugSafetySchema.ts`
- **고아 컴포넌트**: `components/medication/MedicationAnalysisHintBanner.tsx` (이전부터 미사용)

### 수정 (6개 파일)
- `components/elderly/ElderlyHomeScreen.tsx` — `HomeMedicationAnalysisCard`·`useSelfMedicationAnalysis`·`handleMedicationAnalysis` 제거. 남은 복약 상태 카드를 마지막 섹션으로 이동
- `App.tsx` — Intro/Form/Waiting/Result + PrescriptionList import·라우트(elderly 블록) 제거. `DRUG_ANALYSIS_REFRESH_REQUEST` 푸시 라우팅 2곳(expo 핸들러 + elderly switch) 제거
- `types/navigation.ts` — `MedicationAnalysisIntro/Form/Waiting/Result`, `PrescriptionList` 라우트 타입 제거
- `hooks/useDrugSafety.ts` — `useSelfMedicationAnalysis`/`useRequestCodefAuth`/`useConfirmCodefAuth` 및 `selfAnalysis` 쿼리키 제거(보호자용 `useWardMedicationAnalysis`/`useRequestAnalysisRefresh` 유지)
- `services/drugSafetyService.ts` — `requestCodefAuth`/`confirmCodefAuth` 제거(`getMedicationAnalysis`/`requestAnalysisRefresh` 유지)
- `types/drugSafety.ts` — self 인증 타입 `CodefAuthInput`/`CodefAuthSession`/`CodefConfirmInput` 제거

### 유지
- **백엔드 전부** (warnings 로직·DDL·ErrorCode·알림 타입·CODEF/autoRegister 트랜잭션) — 손대지 않음
- **보호자 경로**: `MedicationAnalysisDetailScreen`, `ProtegeMedicationAnalysisBanner`, `GuardianMedicationWarningCard`, `useWardMedicationAnalysis`, `useRequestAnalysisRefresh`, `getMedicationAnalysis`
- **공용 util/타입**: `utils/drugSafety.ts`, `utils/prescription.ts`, `PrescriptionCardGuardian`, `types/drugSafety.ts`의 `MedicationAnalysis`/`Warning`/`Prescription`/`AutoRegisterResult`

### 검증
- `npx tsc --noEmit` 통과. 삭제 관련 타입 에러 0건.
  (남은 에러 2건은 `mocks/safetyZoneMock.ts`, `screens/protectee/LocationTestScreen.tsx`의 기존 문제로 이번 작업과 무관.)

---

## 2026-06-30 · LLM 문진·길안내 기능 제거

작업 브랜치: `chore/remove-hospital-navigation` (아직 커밋 전)

### 배경 / 이유
백엔드에서 `hospital`(LLM 문진·병원 추천)과 `navigation`(도보·대중교통 길안내) 도메인이
통째로 제거되어, 이를 호출하던 프론트 코드도 함께 제거. 두 기능은 외부 API 결과만
표시했고 다른 도메인이 import하는 곳이 없어 의존성 충돌 없이 삭제 가능.

### 삭제 (24개 파일)
- **LLM 문진**: `screens/elderly/MedicalChatScreen.tsx`, `services/medicalChatService.ts`,
  `components/elderly/{ChatBubble,ChatInputBar,TypingIndicator}.tsx`,
  `mocks/medicalChatMock.ts`, `types/medicalChat.ts`
- **병원 추천 / 길안내**: `screens/elderly/{HospitalRecommendResultScreen,HospitalNavigationScreen}.tsx`,
  `components/elderly/{NavigationScreen,TransitGuideScreen,NavigationCardUI,NavigationModeModal}.tsx`,
  `services/navigationService.ts`, `utils/{tmapResponseAdapter,tmapCardParser,markerFilter}.ts`,
  `mocks/mockTmapResponse.ts`, `types/{hospital,tmap}.ts`
- **튜토리얼(병원/문진 흐름)**: `screens/tutorial/{TutorialHomeScreen,TutorialMedicalChatScreen,TutorialHospitalResultScreen,TutorialNavigationScreen}.tsx`

### 수정 (9개 파일)
- `App.tsx` — 삭제 화면 import + `Stack.Screen` 라우트 등록 제거
- `types/navigation.ts` — `MedicalChat`/`HospitalRecommendResult`/`HospitalNavigation`/`TutorialHome`/`TutorialMedicalChat`/`TutorialHospitalResult`/`TutorialNavigation` 라우트, `NavigationCard`/`NavigationRoute` 인터페이스, `tmap` re-export 제거. `TutorialComplete` topic을 `"medication"`만으로 축소
- `types/elderlyHome.ts` — `ElderlyHomeAction`에서 `"hospital"` 제거
- `components/elderly/HomeActionGrid.tsx` — "병원 찾기" 카드 제거, 복약 카드를 가로(full-width) 레이아웃으로 전환
- `components/elderly/ElderlyHomeScreen.tsx` — `hospital` 액션 핸들러·라벨 제거
- `screens/elderly/ElderlySettingsScreen.tsx` — "병원 찾기 연습" 항목 제거(약 챙기기 연습만 유지)
- `constants/tutorialMocks.ts` — 병원/문진/길안내 mock·힌트 제거, medication 힌트만 유지
- `screens/tutorial/TutorialCompleteScreen.tsx` — medication 기준으로 단순화(topic 분기 제거)
- `services/sttService.ts` — 주석에서 삭제된 `ChatInputBar` 언급 일반화(STT는 음성입력 범용 서비스라 유지)

### 유지
- **`sttService` / `useSttRecognition`** — 음성 입력 범용 서비스. 다른 음성 입력 화면에서 재사용 가능해 유지
- **약 챙기기 튜토리얼**(`TutorialMedication*`) — 백엔드와 무관한 mock 흐름이라 유지
- **Kakao 주소 검색**(`kakaoSearchService` / `useKakaoSearch`) — 안전구역 화면에서 사용

### 검증
- `npx tsc --noEmit` 통과. 삭제 관련 타입 에러 0건.
  (남은 에러 2건은 `mocks/safetyZoneMock.ts`, `screens/protectee/LocationTestScreen.tsx`의
  기존 문제로 이번 작업과 무관.)
