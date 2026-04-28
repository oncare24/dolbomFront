// 위치 도메인 API.
// 30분 주기 백그라운드 + 포그라운드 진입 + FCM 깨우기 응답에서 호출.

import { api } from "./api";
import type {
  LastLocation,
  LocationReportInput,
  LocationReportResult,
} from "../types/location";

/** POST /api/locations/reports */
export async function reportLocation(
  input: LocationReportInput,
): Promise<LocationReportResult> {
  const res = await api.post<LocationReportResult>(
    "/api/locations/reports",
    input,
  );
  return res.data;
}

/** GET /api/locations/last?wardId={protegeId} */
export async function getLastLocation(
  protegeId: number,
): Promise<LastLocation> {
  const res = await api.get<LastLocation>("/api/locations/last", {
    params: { wardId: protegeId },
  });
  return res.data;
}
