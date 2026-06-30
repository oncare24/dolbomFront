// 복약 안전 분석 (Graph RAG) 타입 정의 (보호자 조회).
//
// 백엔드 API:
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
  resManufactureDate: string; // ← 추가 (YYYYMMDD)
  resPrescribeNo: string; // ← 추가
  resDrugCode: string; // ← 추가
  imageUrl?: string | null; // ← 신규 (약 이미지 URL)
}

/** 심각도 — UI 색상 매핑. */
export type WarningSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

/** 개별 경고. */
export interface Warning {
  type: WarningType;
  severity: WarningSeverity;
  involvedIngredients: string[];
  involvedDrugNames: string[]; // ← 신규 (약 이름)
  rawMessage: string;
  /** 약 이름 기반 사용자 친화 설명. "...상담해 보세요" 포함. */
  explanation: string;
}

export interface AutoRegisterResult {
  registered: string[];
  skipped: string[];
  duplicates: string[];
}

/** 분석 결과 (조회 응답 / confirm 직후 응답 공통). */
export interface MedicationAnalysis {
  warnings: Warning[];
  prescriptions: Prescription[];
  analyzedAt: string; // ISO datetime
  autoRegisterResult?: AutoRegisterResult; // ← 추가
}
/** 인지 UX(배너/배지)용 신선도. */
export type AnalysisFreshness = "FRESH" | "STALE" | "OUTDATED";
