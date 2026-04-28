// 보호자 시점 — 내 피보호자(ward) 목록 API.
//
// 백엔드 WardResponse → 프론트 Protege 매핑:
//   wardId → id
//   status: INSIDE/OUTSIDE/DISCONNECTED/UNKNOWN → "inside"/"outside"/"disconnected"/"unknown"
//   relationship: null → "" (카드에서 "(관계 미지정)" fallback)
//   avatarColor: 이름 해시로 자동 생성 (백엔드는 보내지 않음)
//   age: 응답에 없음 — 9-F 시점에 Protege에서 제거됨

import { api } from "./api";
import type { Protege, ProtegeStatusType } from "../types/guardianHome";
import { colorFromName } from "../utils/colorFromName";

// ───────────────────────────────────────────────────────
// 백엔드 raw 응답 (WardResponse)
// ───────────────────────────────────────────────────────
type BackendWardStatus = "INSIDE" | "OUTSIDE" | "DISCONNECTED" | "UNKNOWN";

interface WardResponseRaw {
  wardId: number;
  name: string;
  phoneMasked: string;
  relationship: string | null;
  status: BackendWardStatus;
  locationLabel: string;
  lastReportedMinutesAgo: number | null;
  linkedAt: string;
}

function toFrontStatus(s: BackendWardStatus): ProtegeStatusType {
  switch (s) {
    case "INSIDE":
      return "inside";
    case "OUTSIDE":
      return "outside";
    case "DISCONNECTED":
      return "disconnected";
    case "UNKNOWN":
      return "unknown";
  }
}

function toProtege(raw: WardResponseRaw): Protege {
  return {
    id: raw.wardId,
    name: raw.name,
    relationship: raw.relationship ?? "",
    status: toFrontStatus(raw.status),
    locationLabel: raw.locationLabel,
    lastReportedMinutesAgo: raw.lastReportedMinutesAgo,
    avatarColor: colorFromName(raw.name),
  };
}

// ───────────────────────────────────────────────────────
// API
// ───────────────────────────────────────────────────────

/** GET /api/guardian/wards — ACCEPTED 매칭의 ward 목록 + 현재 상태 */
export async function getMyWards(): Promise<Protege[]> {
  const res = await api.get<WardResponseRaw[]>("/api/guardian/wards");
  return res.data.map(toProtege);
}
