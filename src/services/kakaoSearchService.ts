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
