// 어르신 시점 — 내 보호자 목록 API.
// 용도: 보호자 매핑 0명/1명+ 판정 → 위치 추적 시작 여부 결정.

import { api } from "./api";

export interface MyGuardian {
  guardianId: number;
  name: string;
  acceptedAt: string;
}

export async function getMyGuardians(): Promise<MyGuardian[]> {
  const res = await api.get<MyGuardian[]>("/api/elder/guardians");
  return res.data;
}
