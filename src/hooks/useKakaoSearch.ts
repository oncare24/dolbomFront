// 카카오 장소 검색 react-query 훅.
//
// 디바운스 400ms — 사용자가 타이핑을 멈춘 후 검색 트리거 (시중앱 표준).
// 빈 문자열일 때는 자동으로 비활성화되어 호출 X.

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  searchPlaces,
  type KakaoSearchResult,
} from "../services/kakaoSearchService";

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 1;

/**
 * 검색어를 받아 디바운스 처리 후 카카오 검색 결과를 반환.
 *
 * @param query 사용자 입력 검색어
 * @param size 페이지당 결과 수 (기본 10)
 */
export function useKakaoSearch(query: string, size: number = 10) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery<KakaoSearchResult>({
    queryKey: ["kakaoSearch", debouncedQuery, size],
    queryFn: () => searchPlaces(debouncedQuery, 1, size),
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
    // 같은 검색어 재진입 시 즉시 결과 보이게 (시중앱 UX)
    staleTime: 60_000,
    // 키보드 입력 중 윈도우 포커스 변화로 인한 불필요한 재호출 방지
    refetchOnWindowFocus: false,
  });
}
