// 피보호자 분석 상태(복약·미활동) 조회 API.
//
// 백엔드 AnalysisStateResponse → 프론트 WardAnalysisState 매핑:
//   medication / inactivity 가 각각 null 일 수 있음 → "아직 분석 전" 의미(에러 아님).
//   analyzedAt(LocalDateTime ISO 문자열) → analyzedMinutesAgo(number) 로 환산.
//     ※ 서버·기기 모두 KST 기준이라 타임존 없는 ISO 문자열을 로컬 시각으로 파싱해도 일치.
//
// api 인터셉터가 ApiResponse 의 success/data 를 이미 unwrap 하므로 res.data 가 곧 본문.

import { api } from "./api";
import type {
  AnalysisItem,
  InactivityStatusCode,
  MedicationStatusCode,
  WardAnalysisState,
} from "../types/analysisState";

// ───────────────────────────────────────────────────────
// 백엔드 raw 응답 (AnalysisStateResponse / AnalysisStateItemResponse)
// ───────────────────────────────────────────────────────
interface AnalysisItemRaw {
  statusCode: number;
  status: string;
  analyzedAt: string | null;
}

interface AnalysisStateResponseRaw {
  wardId: number;
  medication: AnalysisItemRaw | null;
  inactivity: AnalysisItemRaw | null;
}

/** 타임존 없는 LocalDateTime ISO 문자열 → 경과 분. 값 없음/파싱 실패 시 null. */
function toMinutesAgo(analyzedAt: string | null): number | null {
  if (!analyzedAt) return null;
  const parsed = Date.parse(analyzedAt);
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.round((Date.now() - parsed) / 60_000));
}

function toItem<TCode extends number>(
  raw: AnalysisItemRaw | null,
): AnalysisItem<TCode> | null {
  if (!raw) return null;
  return {
    statusCode: raw.statusCode as TCode,
    status: raw.status,
    analyzedMinutesAgo: toMinutesAgo(raw.analyzedAt),
  };
}

// ───────────────────────────────────────────────────────
// API
// ───────────────────────────────────────────────────────

/**
 * GET /api/wards/{wardId}/analysis-state
 * 피보호자의 최신 복약·미활동 분석 상태 조회. (보호자·피보호자 모두 접근 가능 — 권한 검증 내장)
 */
export async function getWardAnalysisState(
  wardId: number,
): Promise<WardAnalysisState> {
  const res = await api.get<AnalysisStateResponseRaw>(
    `/api/wards/${wardId}/analysis-state`,
  );
  return {
    wardId: res.data.wardId,
    inactivity: toItem<InactivityStatusCode>(res.data.inactivity),
    medication: toItem<MedicationStatusCode>(res.data.medication),
  };
}
