// 처방받은 약 정보 표시용 유틸.
//
// CODEF 원본 응답은 공백이 +로 인코딩되어 들어오는 경우가 있어 표시 전에 정리.
// 복용법은 시니어가 한눈에 이해할 자연어로 변환.

import type { Prescription } from "../types/drugSafety";

/** "+ → 공백" 치환 + trim. null/빈문자 안전. */
export function cleanField(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\+/g, " ").trim();
}

/**
 * 복용법 자연어 변환.
 * @example formatDosage({ resOneDose: "1", resDailyDosesNumber: "3", resTotalDosingdays: "5" })
 *          → "하루 3번 · 1정씩 · 5일"
 */
export function formatDosage(p: Prescription): string {
  const oneDose = p.resOneDose?.trim() || "1";
  const daily = p.resDailyDosesNumber?.trim() || "1";
  const days = p.resTotalDosingdays?.trim() || "1";
  return `하루 ${daily}번 · ${oneDose}회분씩 · ${days}일`;
}

export interface PrescriptionGroup {
  /** 대표 처방 (그룹 첫 항목, 화면 표시용). */
  prescription: Prescription;
  /** 같은 약 + 같은 복용법으로 처방받은 횟수. */
  count: number;
  /** 처방기관들 (중복 제거, 첫 번째가 대표). 여러 곳이면 "외 N곳" 표시용. */
  organizations: string[];
}

/**
 * 같은 약 이름 + 같은 복용법(1회분/하루횟수/총일수) 끼리 그룹화.
 * 18건 → 약 6~8건으로 줄어 시니어 스크롤 부담 완화.
 */
export function groupPrescriptions(
  prescriptions: Prescription[],
): PrescriptionGroup[] {
  const groups = new Map<string, PrescriptionGroup>();

  for (const p of prescriptions) {
    const key = [
      p.resDrugName,
      p.resOneDose,
      p.resDailyDosesNumber,
      p.resTotalDosingdays,
    ].join("|");

    const existing = groups.get(key);
    if (existing) {
      existing.count++;
      if (
        p.resPrescribeOrg &&
        !existing.organizations.includes(p.resPrescribeOrg)
      ) {
        existing.organizations.push(p.resPrescribeOrg);
      }
    } else {
      groups.set(key, {
        prescription: p,
        count: 1,
        organizations: p.resPrescribeOrg ? [p.resPrescribeOrg] : [],
      });
    }
  }

  return Array.from(groups.values());
}
