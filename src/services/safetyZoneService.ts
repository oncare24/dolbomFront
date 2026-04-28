// 안전구역 도메인 API.
//
// 백엔드와의 변환 규칙:
//  - protegeId (프) ↔ wardId (백)
//  - "home"/"senior_center"/... (프) ↔ "HOME"/"SENIOR_CENTER"/... (백)
//
// authService가 role 변환하는 패턴과 동일.

import { api } from "./api";
import type { SafetyZone, SafetyZoneType } from "../types/safetyZone";

// ───────────────────────────────────────────────────────
// 백엔드 ↔ 프론트 변환 헬퍼
// ───────────────────────────────────────────────────────
type BackendZoneType = "HOME" | "SENIOR_CENTER" | "HOSPITAL" | "CUSTOM";

function toBackendType(t: SafetyZoneType): BackendZoneType {
  return t.toUpperCase() as BackendZoneType;
}

function toFrontType(t: BackendZoneType): SafetyZoneType {
  return t.toLowerCase() as SafetyZoneType;
}

// ───────────────────────────────────────────────────────
// 백엔드 raw 응답 (SafetyZoneResponse)
// ───────────────────────────────────────────────────────
interface SafetyZoneResponseRaw {
  id: number;
  wardId: number;
  guardianId: number;
  name: string;
  type: BackendZoneType;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  notificationEnabled: boolean;
  lastVisitedMinutesAgo: number | null; // ← 추가
}

function toFrontZone(raw: SafetyZoneResponseRaw): SafetyZone {
  return {
    id: raw.id,
    protegeId: raw.wardId,
    guardianId: raw.guardianId,
    name: raw.name,
    type: toFrontType(raw.type),
    address: raw.address,
    latitude: raw.latitude,
    longitude: raw.longitude,
    radius: raw.radius,
    notificationEnabled: raw.notificationEnabled,
    // lastVisitedMinutesAgo는 위치보고 도메인에서 별도 조회 (Step 8)
    lastVisitedMinutesAgo: raw.lastVisitedMinutesAgo, // ← 변경 (백엔드가 채워줌)
  };
}

// ───────────────────────────────────────────────────────
// Request DTO (프론트 → 백엔드 body)
// ───────────────────────────────────────────────────────
export interface CreateSafetyZoneInput {
  protegeId: number;
  name: string;
  type: SafetyZoneType;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface UpdateSafetyZoneInput {
  name: string;
  type: SafetyZoneType;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
}

// ───────────────────────────────────────────────────────
// API
// ───────────────────────────────────────────────────────

/** GET /api/safety-zones?wardId={protegeId} */
export async function getSafetyZones(protegeId: number): Promise<SafetyZone[]> {
  const res = await api.get<SafetyZoneResponseRaw[]>("/api/safety-zones", {
    params: { wardId: protegeId },
  });
  return res.data.map(toFrontZone);
}

/** GET /api/safety-zones/{id} */
export async function getSafetyZone(id: number): Promise<SafetyZone> {
  const res = await api.get<SafetyZoneResponseRaw>(`/api/safety-zones/${id}`);
  return toFrontZone(res.data);
}

/** POST /api/safety-zones */
export async function createSafetyZone(
  input: CreateSafetyZoneInput,
): Promise<SafetyZone> {
  const res = await api.post<SafetyZoneResponseRaw>("/api/safety-zones", {
    wardId: input.protegeId,
    name: input.name,
    type: toBackendType(input.type),
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    radius: input.radius,
  });
  return toFrontZone(res.data);
}

/** PUT /api/safety-zones/{id} */
export async function updateSafetyZone(
  id: number,
  input: UpdateSafetyZoneInput,
): Promise<SafetyZone> {
  const res = await api.put<SafetyZoneResponseRaw>(`/api/safety-zones/${id}`, {
    name: input.name,
    type: toBackendType(input.type),
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    radius: input.radius,
  });
  return toFrontZone(res.data);
}

/** PATCH /api/safety-zones/{id}/notification */
export async function updateSafetyZoneNotification(
  id: number,
  enabled: boolean,
): Promise<SafetyZone> {
  const res = await api.patch<SafetyZoneResponseRaw>(
    `/api/safety-zones/${id}/notification`,
    { enabled },
  );
  return toFrontZone(res.data);
}

/** DELETE /api/safety-zones/{id} */
export async function deleteSafetyZone(id: number): Promise<void> {
  await api.delete(`/api/safety-zones/${id}`);
}
