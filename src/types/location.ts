// 위치 도메인 타입.
//
// 백엔드 LocationReportSource enum과 1:1 매칭. axios에서 변환 없이 그대로 전송.

export type LocationReportSource =
  | "BACKGROUND_SCHEDULED"
  | "FCM_WAKEUP"
  | "FOREGROUND_RESUME";

export type DeviceState = "NEVER_CONNECTED" | "ACTIVE" | "DISCONNECTED";

export interface LocationReportInput {
  latitude: number;
  longitude: number;
  accuracy: number;
  reportSource: LocationReportSource;
}

export interface LocationReportResult {
  stored: boolean;
  reportId: number | null;
  reportedAt: string | null; // ISO datetime
}

export interface LastLocation {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  reportedAt: string | null;
  deviceState: DeviceState;
  lastReportAt: string | null;
}
