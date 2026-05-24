// 분석 상태(복약·미활동) 도메인 타입.
// 백엔드 GET /api/wards/{wardId}/analysis-state 응답을 프론트 친화 형태로 매핑한 결과.
//
// 이상탐지 엔진(InactivityAnalysisService)이 위치 이벤트마다 분석해 WardAnalysisState에
// 저장한 결과를 읽어온다. 이번 작업의 핵심은 inactivity(미활동). medication은 응답에
// 같이 내려오므로 타입에 포함만 해두고 화면 표시는 추후 확장.

/** 미활동 분석 상태 코드. 0=정상 활동, 1=장시간 활동 없음, 2=위치 확인 불가. */
export type InactivityStatusCode = 0 | 1 | 2;

/** 복약 분석 상태 코드. 0=정시 복약, 1=지연, 2=미복용. (이번 작업 범위 밖) */
export type MedicationStatusCode = 0 | 1 | 2;

export interface AnalysisItem<TCode extends number> {
  /** 분석 상태 코드. */
  statusCode: TCode;
  /** 백엔드가 내려준 상태명 (예: "ACTIVE"/"INACTIVE"/"UNKNOWN"). 로깅·디버깅용. */
  status: string;
  /** 마지막 분석 시점으로부터 경과한 분. null = 분석 시각 없음/파싱 실패. */
  analyzedMinutesAgo: number | null;
}

export interface WardAnalysisState {
  wardId: number;
  /** 미활동 분석 결과. null = 아직 분석된 적 없음(데이터·규칙 준비 중). */
  inactivity: AnalysisItem<InactivityStatusCode> | null;
  /** 복약 분석 결과. null = 아직 분석된 적 없음. */
  medication: AnalysisItem<MedicationStatusCode> | null;
}
