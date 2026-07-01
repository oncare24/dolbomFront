# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 변경 이력 기록 (필수)

**코드를 수정·추가·삭제하는 작업을 완료하면 항상 `CHANGELOG.md` 맨 위에 항목을 추가한다.**
- 한 작업(논리적 단위) = 한 항목. `날짜 · 제목` 헤더 아래에 **무엇을 / 왜 / 영향 범위(파일·화면·라우트) / 검증 결과**를 적는다.
- 날짜는 절대값(YYYY-MM-DD)으로 쓴다.
- 사소한 오타·포맷 수정만 한 경우는 생략 가능하나, 화면/라우트/API 연동/타입/의존성/동작이 바뀌면 반드시 기록한다.

## 프로젝트 개요

보살핌(bosalpim) — 한국어 기반 Expo / React Native 노인 돌봄 앱. 하나의 코드베이스에서 두 가지 사용자 역할을 런타임에 분기한다.

- **elderly (피보호자)** — 폰을 쓰는 어르신: 복약 알림/알람, SOS, 보호자 초대 수신.
- **guardian (보호자)** — 어르신을 모니터링하는 보호자: 안전구역(지오펜스), 이상감지 기록, 복약 분석, 알림, 초대 발송.

UI 문자열, 코드 주석, 커밋 메시지가 대부분 한국어다. 코드를 수정할 때 이 컨벤션을 따를 것.

## 명령어

```bash
npm start            # expo start (Metro)
npm run android      # expo start --android
npm run ios          # expo start --ios
npx tsc --noEmit     # 타입 체크 — 별도 lint/test 설정 없음
```

Expo/EAS 외에 **테스트 러너, 린터, 빌드 스크립트가 없다.** 정적 검사는 `tsc`(strict 모드, `expo/tsconfig.base` 확장)뿐이다.

네이티브 모듈(Naver Map, notifee/풀스크린 알람, 음성 인식, secure store)을 쓰므로 **Expo Go에서는 실행할 수 없다** — dev client / EAS 빌드가 필요하다. EAS 프로필은 `eas.json`에 있다(`development`, `preview`, `production`). `app.config.js`는 동적 설정이며(`process.env`를 읽음) 정적 `app.json`은 없다.

## 환경 변수

`EXPO_PUBLIC_API_BASE_URL`(`.env`에 있고 `eas.json`의 프로필별로도 설정됨)이 백엔드 base URL이다. 안드로이드 에뮬레이터는 LAN IP로 호스트 PC에 접근할 수 없으니 `http://10.0.2.2:8080`을 사용한다. 현재 `.env`는 ngrok 터널을 가리킨다.

## 아키텍처

### 레이어 구조
`screens/`(일부는 `components/elderly|guardian/*Screen.tsx`) → `hooks/`(react-query) → `services/`(axios 호출 + 백엔드↔프론트 매핑) → `services/api.ts`(유일한 axios 인스턴스). 순수 로직은 `utils/`, 공용 타입은 `types/`, 디자인 토큰은 `theme/`에 있다.

> 참고: 모든 화면이 `screens/` 아래에 있지는 않다. 홈 화면과 안전구역 화면은 컴포넌트다: `ElderlyHomeScreen` / `GuardianHomeScreen` / `SafetyZoneListScreen` / `SafetyZoneEditScreen`은 `components/`에 있다. 화면을 추가할 때는 **`App.tsx`**에 등록하고, `src/types/navigation.ts`의 **`RootStackParamList`**에 파라미터를 추가한다.

### 내비게이션 & 라우팅 (`App.tsx`)
단일 native-stack 내비게이터. 등록되는 `Stack.Screen` 집합은 인증 상태에 따라 선택된다: `!isAuthenticated` → Login/Signup, 그렇지 않으면 `role === "elderly"`와 `guardian`이 **서로 겹치지 않는** 화면 집합을 갖는다. `App.tsx`는 렌더링 전에 `isHydrated`(SecureStore에서 인증 정보 복원 완료)를 기다린다. `navigationRef`는 React 바깥(알림 탭)에서 내비게이션하기 위해 export된다.

푸시 알림 탭 라우팅은 `App.tsx`의 `AppContent` effect들에 `data.type` 기준으로 모여 있다(`SOS`, `ZONE_EXIT/ENTER`, `WARD_INVITATION`, `MEDICATION_REMINDER`, `DRUG_ANALYSIS_REFRESH_REQUEST`, `MEDICATION_SCHEDULE_CHANGED`). cold start 시 내비게이션 컨테이너가 아직 마운트되지 않았을 수 있어, `navigationRef.isReady()`를 폴링하는 `tryNavigate` 재시도 루프를 사용한다.

### 인증 (`src/stores/authStore.ts`)
**expo-secure-store**에 persist되는 Zustand 스토어. 2단계 로그인을 의도적으로 사용한다: `setTokensOnly()`는 토큰만 저장하고 `isAuthenticated=false`를 유지해, axios 인터셉터가 `getMe` 호출에 bearer를 붙일 수 있게 하면서도 라우터가 elderly/guardian 화면으로 미리 분기하지 않게 한다. 역할이 확정되면 `login()`이 `isAuthenticated=true` + user를 커밋한다. `_setHydrated`가 스플래시를 제어한다.

### API 클라이언트 (`src/services/api.ts`)
공용 `api` axios 인스턴스 하나. 응답 인터셉터가 백엔드 **`ApiResponse` 엔벨로프를 벗겨낸다**(`{ success, data }` → `data`; `{ success:false, error }` → `ApiException(code, message)` throw). 따라서 서비스는 이미 언랩된 데이터를 받고, 화면은 `catch (e: ApiException)`로 처리한다. 인터셉터는 또한 bearer 부착, 401+`A003`(만료 토큰) 발생 시 `/api/auth/reissue`를 통한 자동 재발급(동시 401이 하나의 재발급을 공유하도록 single-flight 큐 사용), 복구 불가 401 시 강제 로그아웃, 네트워크/타임아웃 에러의 전역 Toast를 담당한다. `ApiException` throw가 계약이므로 유지할 것.

### 데이터 페칭 (`src/hooks/*`)
전반적으로 react-query 사용. 각 도메인 훅 파일은 `*Keys` 쿼리 키 팩토리를 export한다(예: `medicationKeys`, `invitationKeys`) — `App.tsx`의 invalidation과 mutation이 이에 의존하므로 **쿼리 키는 항상 이 팩토리로 만들고** 인라인 배열을 쓰지 말 것. mutation은 optimistic update를 사용한다. 전역 기본값(`App.tsx`): `staleTime` 5분, `retry` 1, refetch-on-focus 끔.

### 백엔드 ↔ 프론트 필드 매핑
서비스 레이어가 변환 경계다. 반복되는 컨벤션: 백엔드 `wardId` ⇄ 프론트 `protegeId`; 백엔드 `LocalTime` `"HH:mm:ss"` ⇄ 프론트 `"HH:mm"`(`medicationService.ts`의 `toFrontTime`/`toBackendTime` 참조). 매핑은 화면이 아니라 서비스 레이어에 둘 것.

### 테마 (`src/theme/`)
모든 시각 상수는 토큰이다: `Colors`, `Typography`, `Spacing`/`Radius`/`ScreenPadding`, `Touch`, `Elevation`(`theme/index.ts`에서 재export). Typography는 **audience 인식형**이다: `Typography.elderly`는 시니어 가독성을 위해 더 큰 크기 + 양수 letter-spacing을 쓰고, `Typography.guardian`과 구분된다. 텍스트는 `AppText`(`components/common/Text`)로 렌더링하며, 이 컴포넌트는 `variant` + `audience` + 토큰 `color`를 받는다. 폰트 크기/색을 하드코딩하거나 raw `<Text>`를 쓰지 말 것. `components/common/*`(Button, Card, Badge, Input, BottomSheet, Toast 등)이 공용 프리미티브이며, 각 폴더는 `index.ts`로 재export한다.

### 알림 & 백그라운드 태스크
두 알림 시스템이 공존한다: **expo-notifications**(대부분의 푸시 타입)와 **react-native-notify-kit / notifee**(잠금 화면 위에서 떠야 하는 풀스크린 복약 알람 — `SYSTEM_ALERT_WINDOW` / 풀스크린 인텐트 권한과 `./plugins/withFullScreenAlarm` 설정 플러그인 필요). `index.ts`는 `registerRootComponent` 전에 모듈 로드 시점에 `notifee.onBackgroundEvent`와 복약 동기화 백그라운드 태스크를 등록한다. `useMedicationReminderSync`가 OS 정확 알람(exact alarm)을 서버 일정과 동기화하며, 포그라운드/`active` AppState 전환 시 silent push 누락에 대비해 일정 쿼리를 강제 invalidate한다. 백그라운드 **위치** 지오펜싱은 `services/backgroundLocationTask.ts`로 연결되며(`App.tsx`에서 side effect용으로 import) 처리된다.

### 튜토리얼 흐름
`screens/tutorial/*`와 `components/tutorial/*`는 실제 elderly 화면을 미러링하지만 **mock 데이터로 동작하며 API 호출이 없다**(`react-native-copilot` 하이라이트 + `tutorialSpeechService`를 통한 TTS 사용). 실제 elderly 화면을 수정할 때는 그 튜토리얼 쌍에도 같은 변경이 필요한지 확인할 것.

### 지도 & 주소 검색
지도 렌더링은 Naver Map(`@mj-studio/react-native-naver-map`)을 사용한다 — 안전구역 등록/미리보기(`SafetyZoneEditScreen`, `SafetyZoneMapPreview`, `CenteredPinMap`)와 SOS 위치 보기(`SosLocationViewScreen`). 주소 검색은 Kakao(`kakaoSearchService` / `useKakaoSearch`)를 사용한다.
