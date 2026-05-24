// src/utils/medicationGroup.ts
// 같은 약(이름·주기·기간)을 한 묶음으로. 매일=시간들 합침, 요일 지정=요일+시간 합침.

import type { DayOfWeek, MedicationSchedule } from "../types/medication";

export interface MedicationGroup {
  key: string;
  medicationName: string;
  scheduleType: MedicationSchedule["scheduleType"];
  daysOfWeek: DayOfWeek[]; // 요일 지정일 때 합쳐진 요일 (매일이면 [])
  startDate?: string | null;
  endDate?: string | null;
  times: string[]; // 합쳐진 시각 (정렬)
  schedules: MedicationSchedule[]; // 이 약의 모든 행 (상태·편집용)
}

const DOW_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function keyOf(s: MedicationSchedule): string {
  return [
    s.medicationName,
    s.scheduleType,
    s.startDate ?? "",
    s.endDate ?? "",
  ].join("|");
}

export function groupSchedules(
  schedules: MedicationSchedule[],
): MedicationGroup[] {
  const map = new Map<string, MedicationGroup>();
  for (const s of schedules) {
    const key = keyOf(s);
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        medicationName: s.medicationName,
        scheduleType: s.scheduleType,
        daysOfWeek: [],
        startDate: s.startDate,
        endDate: s.endDate,
        times: [],
        schedules: [],
      };
      map.set(key, g);
    }
    g.schedules.push(s);
  }

  const groups = [...map.values()];
  for (const g of groups) {
    const timeSet = new Set<string>();
    const daySet = new Set<DayOfWeek>();
    for (const s of g.schedules) {
      timeSet.add(s.scheduledTime);
      for (const d of s.daysOfWeek) daySet.add(d);
    }
    g.times = [...timeSet].sort((a, b) => a.localeCompare(b));
    g.daysOfWeek = DOW_ORDER.filter((d) => daySet.has(d));
  }
  groups.sort((a, b) => (a.times[0] ?? "").localeCompare(b.times[0] ?? ""));
  return groups;
}
