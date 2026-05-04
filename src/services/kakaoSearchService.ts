// 카카오 로컬 검색 도메인 API.
//
// 백엔드 프록시(/api/kakao/search)를 통해서만 호출 — REST API 키는 서버에만 보관.
// 백엔드 응답 형식은 BaseAPI(ApiResponse) → axios 인터셉터가 unwrap해서 data만 옴.

import { api } from "./api";

// ───────────────────────────────────────────────────────
// 백엔드 응답 타입 (PlaceSearchResponse / PlaceSearchResult)
// ───────────────────────────────────────────────────────

export interface KakaoPlace {
  placeName: string;
  addressName: string;
  roadAddressName: string | null;
  latitude: number;
  longitude: number;
  category: string;
}

export interface KakaoSearchResult {
  results: KakaoPlace[];
  hasMore: boolean;
  totalCount: number;
}

// ───────────────────────────────────────────────────────
// API
// ───────────────────────────────────────────────────────

/**
 * GET /api/kakao/search?query={query}&page={page}&size={size}
 *
 * @param query 검색어 (1~80자). 장소명/주소/랜드마크 모두 가능.
 * @param page 1-indexed 페이지 번호 (기본 1)
 * @param size 페이지당 결과 수 (기본 10, 최대 15)
 */
export async function searchPlaces(
  query: string,
  page: number = 1,
  size: number = 10,
): Promise<KakaoSearchResult> {
  const res = await api.get<KakaoSearchResult>("/api/kakao/search", {
    params: { query, page, size },
  });
  return res.data;
}

// ───────────────────────────────────────────────────────
// 좌표 → 주소 변환 (Reverse Geocoding)
// ───────────────────────────────────────────────────────

export interface ReverseGeocodeResult {
  roadAddress: string | null; // 도로명 주소 (있으면 우선)
  address: string | null; // 지번 주소 (도로명 없으면 fallback)
}

/**
 * GET /api/kakao/coord2address?latitude={lat}&longitude={lng}
 *
 * 안전구역 등록/수정 화면에서 핀이 멈춘 좌표를 주소로 자동 변환.
 * 둘 다 null이면 해상/산간 등 주소가 없는 위치 — 사용자가 직접 입력해야 함.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  const res = await api.get<ReverseGeocodeResult>("/api/kakao/coord2address", {
    params: { latitude, longitude },
  });
  return res.data;
}
