// 길안내 화면 지도 마커 필터링 유틸.
//
// 문제: TMAP/ODsay는 보행자 안내 시 직진/횡단보도 등 step을 모두 카드로 만들어줘서
//       3.6km 도보 길에 22개의 안내 카드가 생성된다. 이걸 모두 마커로 표시하면
//       출발 지점에 마커 4-5개가 겹쳐서 어지러움.
//
// 해결: 카드 자체는 모두 유지(step-by-step 안내에 필요)하되, 지도 마커는
//       의미 있는 안내지점에만 표시.
//
// TMAP turnType 코드 참고:
//   11  = 직진(STRAIGHT, WALK, BUS, SUBWAY)
//   12  = 좌회전 (TURN_LEFT)
//   13  = 우회전 (TURN_RIGHT)
//   14  = 유턴 (TURN_BACK)
//   200 = 출발 (START)
//   201 = 도착 (ARRIVAL)
//   211 = 횡단보도 (CROSSWALK)

import type { NavigationCard } from "../types/navigation";

const TURN_LEFT = 12;
const TURN_RIGHT = 13;
const TURN_BACK = 14;
const START = 200;
const ARRIVAL = 201;

/**
 * 지도에 마커로 표시할 만한 "중요한" 안내지점인지 판단.
 *
 * 표시 (TRUE):
 *   - 출발/도착 (START, ARRIVAL)
 *   - 좌회전, 우회전, 유턴 (TURN_*)
 *   - 버스/지하철 탑승지점 (이름에 "버스" 또는 "호선" 포함, turnType=11이지만 식별 가능)
 *
 * 숨김 (FALSE):
 *   - 직진 (turnType=11, name 없음) — 너무 많이 등장
 *   - 횡단보도 (turnType=211) — 보통 직진과 함께 등장, 어지러움
 */
export function shouldShowMarker(card: NavigationCard): boolean {
  const t = card.turnType;

  // 출발/도착: 항상 표시
  if (t === START || t === ARRIVAL) return true;

  // 회전류: 항상 표시
  if (t === TURN_LEFT || t === TURN_RIGHT || t === TURN_BACK) return true;

  // 버스/지하철: turnType=11이지만 name으로 식별
  // (BUS는 "100번 버스", SUBWAY는 "2호선" 형태)
  const name = card.name;
  if (name && (name.includes("버스") || name.includes("호선"))) {
    return true;
  }

  return false;
}
