// SOS 도메인 API.
//
// POST /api/sos              — 호출 발행
// GET  /api/sos/{eventId}    — 이벤트 상세 (보호자 SosLocationView용)

import { api } from "./api";
import type {
  SosEvent,
  SosEventDetail,
  SosTriggerInput,
  SosLocationSource,
} from "../types/sos";

// ───────────────────────────────────────────────────────
// raw 응답
// ───────────────────────────────────────────────────────
interface SosEventResponseRaw {
  eventId: number;
  latitude: number | null;
  longitude: number | null;
  locationSource: SosLocationSource;
  notifiedGuardianCount: number;
  createdAt: string;
}

interface SosEventDetailResponseRaw {
  eventId: number;
  wardId: number;
  wardName: string;
  wardPhone: string;
  latitude: number | null;
  longitude: number | null;
  locationSource: SosLocationSource;
  notifiedGuardianCount: number;
  createdAt: string;
}

function toFrontEvent(raw: SosEventResponseRaw): SosEvent {
  return {
    eventId: raw.eventId,
    latitude: raw.latitude,
    longitude: raw.longitude,
    locationSource: raw.locationSource,
    notifiedGuardianCount: raw.notifiedGuardianCount,
    createdAt: raw.createdAt,
  };
}

function toFrontDetail(raw: SosEventDetailResponseRaw): SosEventDetail {
  return {
    eventId: raw.eventId,
    wardId: raw.wardId,
    wardName: raw.wardName,
    wardPhone: raw.wardPhone,
    latitude: raw.latitude,
    longitude: raw.longitude,
    locationSource: raw.locationSource,
    notifiedGuardianCount: raw.notifiedGuardianCount,
    createdAt: raw.createdAt,
  };
}

// ───────────────────────────────────────────────────────
// API
// ───────────────────────────────────────────────────────

/** POST /api/sos */
export async function triggerSos(input: SosTriggerInput): Promise<SosEvent> {
  const res = await api.post<SosEventResponseRaw>("/api/sos", {
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    accuracy: input.accuracy ?? null,
  });
  return toFrontEvent(res.data);
}

/** GET /api/sos/{eventId} — 보호자 SosLocationView 진입 시 */
export async function getSosEvent(eventId: number): Promise<SosEventDetail> {
  const res = await api.get<SosEventDetailResponseRaw>(`/api/sos/${eventId}`);
  return toFrontDetail(res.data);
}
