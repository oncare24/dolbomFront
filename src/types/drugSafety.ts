// 복약 안전 분석 (Graph RAG) 타입 정의.
//
// 백엔드 API:
//  - POST /api/drug-safety/auth/request   1차 카카오톡 간편인증 요청
//  - POST /api/drug-safety/auth/confirm   2차 인증 확정 + 처방전 분석
//  - GET  /api/drug-safety/analysis       캐시된 결과 조회 (wardId 옵션)

/** 경고 유형 — Graph RAG 스펙. */
export type WarningType =
  | "CONTRAINDICATED" // 병용금기 (직접/간접)
  | "ELDERLY" // 노인주의
  | "DUPLICATE" // 효능군중복
  | "PREGNANCY" // 임부금기
  | "OVERDOSE" // 용량주의
  | "DURATION"; // 투여기간주의

/** 처방받은 약. CODEF 원본 필드명(resXxx) 유지. 누락 가능 필드는 null/빈문자열. */
export interface Prescription {
  resDrugName: string;
  resIngredients: string;
  resPrescribeDrugEffect: string | null;
  resContent: string;
  resOneDose: string;
  resDailyDosesNumber: string;
  resTotalDosingdays: string;
  resPrescribeOrg: string;
}

/** 심각도 — UI 색상 매핑. */
export type WarningSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

/** 개별 경고. */
export interface Warning {
  type: WarningType;
  severity: WarningSeverity;
  involvedIngredients: string[];
  rawMessage: string;
  /** 약 이름 기반 사용자 친화 설명. "...상담해 보세요" 포함. */
  explanation: string;
}

/** 사용자가 폼에서 입력하는 인증 정보 (1차). */
export interface CodefAuthInput {
  userName: string;
  identity: string; // 주민번호 13자리 (하이픈 없이)
  phoneNo: string; // 전화번호 10~11자리 (하이픈 없이)
}

/** 1차 인증 응답 — 2차 확정 시 그대로 다시 전달. */
export interface CodefAuthSession {
  jti: string;
  twoWayTimestamp: number;
  transactionId: string;
}

/** 2차 확정 입력 — 1차 입력 + 1차 응답. */
export interface CodefConfirmInput extends CodefAuthInput {
  jti: string;
  twoWayTimestamp: number;
}

/** 분석 결과 (조회 응답 / confirm 직후 응답 공통). */
export interface MedicationAnalysis {
  warnings: Warning[];
  prescriptions: Prescription[];
  analyzedAt: string; // ISO datetime
}
/** 인지 UX(배너/배지)용 신선도. */
export type AnalysisFreshness = "FRESH" | "STALE" | "OUTDATED";
