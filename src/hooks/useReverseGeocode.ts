// 좌표 → 주소 자동 변환 react-query 훅.
//
// CenteredPinMap의 카메라 정지(idle) 시 onCenterChanged 콜백이 250ms 디바운스 후 부모에 좌표 전달.
// 그 좌표가 SafetyZoneEditScreen의 center state로 들어오면 이 훅이 자동 호출되어
// 카카오 coord2address API → 주소 입력란에 자동 채움.
//
// queryKey에 좌표를 5자리(약 1m 정밀도)로 잘라서 GPS 미세 떨림에도 캐시 적중되게 함.
// staleTime 5분 — 같은 좌표 반복 호출 시 카카오 API 호출 절약.

import { useQuery } from "@tanstack/react-query";
import {
  reverseGeocode,
  type ReverseGeocodeResult,
} from "../services/kakaoSearchService";

/**
 * 좌표를 받아 카카오 coord2address API로 주소를 조회.
 *
 * @param latitude  위도
 * @param longitude 경도
 * @param enabled   호출 활성화 여부 (false면 호출 X)
 */
export function useReverseGeocode(
  latitude: number,
  longitude: number,
  enabled: boolean = true,
) {
  return useQuery<ReverseGeocodeResult>({
    queryKey: ["reverseGeocode", latitude.toFixed(5), longitude.toFixed(5)],
    queryFn: () => reverseGeocode(latitude, longitude),
    enabled,
    staleTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
  });
}
