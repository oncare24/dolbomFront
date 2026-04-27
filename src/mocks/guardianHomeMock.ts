// 보호자 홈 mock 데이터. 백엔드 연동 시 useQuery로 교체.

import type { Protege } from "../types/guardianHome";

export const MOCK_PROTEGES: Protege[] = [
  {
    id: 1,
    name: "김복자",
    relationship: "어머니",
    age: 75,
    status: "inside",
    locationLabel: "집 근처",
    lastReportedMinutesAgo: 8,
    avatarColor: "#E27D9F", // 분홍
  },
  {
    id: 2,
    name: "박영수",
    relationship: "아버지",
    age: 78,
    status: "outside",
    locationLabel: "안전구역 외부",
    lastReportedMinutesAgo: 5,
    avatarColor: "#5E8FC7", // 파랑
  },
  {
    id: 3,
    name: "이순자",
    relationship: "어머니",
    age: 82,
    status: "disconnected",
    locationLabel: "마지막 위치 확인 중",
    lastReportedMinutesAgo: 47,
    avatarColor: "#8E7CC3", // 보라
  },
];
