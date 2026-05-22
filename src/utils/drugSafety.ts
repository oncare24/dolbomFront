// 복약 안전 분석 표시용 유틸.

import type {
  AnalysisFreshness,
  Warning,
  WarningSeverity,
} from "../types/drugSafety";

const SEVERITY_ORDER: Record<WarningSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/** severity 우선순위로 정렬 (CRITICAL → LOW). 동일 시 원래 순서 유지. */
export function sortWarningsBySeverity(warnings: Warning[]): Warning[] {
  return [...warnings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

/** Graph RAG 가 추론한 간접 위험 여부 (rawMessage 가 "[간접 위험]" 으로 시작). */
export function isIndirectRisk(warning: Warning): boolean {
  return warning.rawMessage?.startsWith("[간접 위험]") ?? false;
}

/**
 * 분석 받은 시각으로부터 경과한 일수 기반 신선도.
 *  - 7일 이내  : FRESH
 *  - 30일 이내 : STALE   (배너 노출 시작)
 *  - 그 외     : OUTDATED (강조 배너)
 */
export function getAnalysisFreshness(analyzedAt: string): AnalysisFreshness {
  const diffDays = (Date.now() - new Date(analyzedAt).getTime()) / 86_400_000;
  if (diffDays <= 7) return "FRESH";
  if (diffDays <= 30) return "STALE";
  return "OUTDATED";
}

/** 분석 시각의 사용자 친화 표시 — "오늘 분석" / "3일 전 분석" / "2025.01.05 분석". */
export function formatAnalyzedAt(analyzedAt: string): string {
  const date = new Date(analyzedAt);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);

  if (diffDays <= 0) return "오늘 분석";
  if (diffDays === 1) return "어제 분석";
  if (diffDays < 7) return `${diffDays}일 전 분석`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전 분석`;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} 분석`;
}

/** severity 색상 토큰 키 (theme 컬러 매핑 시 사용). */
export function severityColorKey(
  severity: WarningSeverity,
): "critical" | "high" | "medium" | "low" {
  switch (severity) {
    case "CRITICAL":
      return "critical";
    case "HIGH":
      return "high";
    case "MEDIUM":
      return "medium";
    case "LOW":
      return "low";
  }
}
/**
 * 시니어 화면용 explanation 정리.
 * - 괄호 안 성분명 제거: "록소로펜정(록소프로펜)" → "록소로펜정"
 * - 끝부분 "의사나 약사와 상담해 보세요" 제거 (화면 하단 도움말 카드에서 한 번만 표시)
 */
export function cleanExplanation(text: string): string {
  if (!text) return "";
  return text
    .replace(/\s*\([^)]+\)/g, "") // 괄호 + 안 내용
    .replace(
      /\s*[,.]*\s*(?:(?:반드시|따라서|그러므로)\s*)*의사나?\s*약사와?\s*상담해?\s*보세요\.?\s*$/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}
