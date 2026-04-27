// 피보호자 홈 mock 데이터. 백엔드 연동 시 useQuery로 교체.

import type { MedicationStatus, SafeZoneStatus } from "../types/elderlyHome";

export const MOCK_MEDICATION_STATUS: MedicationStatus = {
  totalCount: 3,
  takenCount: 1,
  nextTime: "12:30",
  nextLabel: "점심 약",
};

export const MOCK_SAFEZONE_STATUS: SafeZoneStatus = {
  isInside: true,
  currentLabel: "집 근처",
};
