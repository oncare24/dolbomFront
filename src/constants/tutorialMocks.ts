// 튜토리얼 시나리오 1 ("병원 찾기") mock 데이터.
// 실제 API 호출 없이 시연용으로만 사용.

import type { RecommendResponse } from "../types/hospital";

// ─── 1) LLM 채팅 mock ───

/** 첫 화면 안내 인사말 */
export const TUTORIAL_INITIAL_BOT_MESSAGE =
  "어디가 어떻게 불편하신가요?\n글로 적어 주시거나 마이크를 눌러 말씀해 주세요.";

/**
 * 사용자 응답 한 턴 = [사용자 입력 매칭] → [봇 응답]
 *
 * 매칭 로직:
 *   - 사용자 입력에 keywords 중 하나라도 포함 → 통과 → botReply 표시
 *   - 매칭 실패 → retryReply 표시, 같은 턴 계속 입력 대기
 *
 * 마지막 턴(isFinal=true)의 봇 응답 후엔 자동으로 결과 화면 이동.
 */
export interface TutorialChatTurn {
  /** 화면 하단 hint에 표시되는 예시 문구 */
  examples: string[];
  /** 사용자 입력에 이 중 하나라도 포함되면 매칭 통과 */
  keywords: string[];
  /** 매칭 통과 시 봇이 보내는 응답 */
  botReply: string;
  /** 매칭 실패 시 봇이 보내는 응답 */
  retryReply: string;
  /** 마지막 턴 표시 — true면 botReply 후 자동 결과 화면 이동 */
  isFinal?: boolean;
}

export const TUTORIAL_CHAT_TURNS: TutorialChatTurn[] = [
  // 턴 1: 첫 증상 입력
  {
    examples: ["허리가 아파요", "기침이 멈추지 않아요", "이가 시리고 아파요"],
    keywords: [
      "허리",
      "기침",
      "이",
      "아파",
      "아픔",
      "아픕",
      "시려",
      "시린",
      "통증",
      "쑤셔",
      "결려",
    ],
    botReply:
      "그러시군요. 언제부터 그러셨나요?\n어제부터인지, 며칠 됐는지 알려주세요.",
    retryReply:
      "음... 어디가 불편하신지 잘 모르겠어요.\n예를 들어 ‘허리가 아파요’처럼 적어 보세요.",
  },
  // 턴 2: 기간 입력
  {
    examples: ["어제부터요", "3일 정도 됐어요", "일주일 넘었어요"],
    keywords: [
      "어제",
      "그제",
      "오늘",
      "일",
      "주일",
      "주",
      "달",
      "개월",
      "전부터",
      "됐",
      "지났",
      "넘었",
      "정도",
    ],
    botReply:
      "알겠습니다. 통증이 많이 심하신가요?\n조금 불편한 정도인지, 일상생활이 힘드신지요?",
    retryReply:
      "언제부터 그러셨는지 알려주세요.\n예: ‘어제부터요’, ‘3일 됐어요’",
  },
  // 턴 3: 강도 입력 (마지막 턴)
  {
    examples: ["조금 불편해요", "꽤 아파요", "많이 힘들어요"],
    keywords: [
      "조금",
      "꽤",
      "많이",
      "심해",
      "약간",
      "정말",
      "엄청",
      "너무",
      "힘들",
      "괜찮",
      "참을",
      "불편",
      "아파",
      "아픕",
    ],
    botReply: "알려주셔서 감사합니다.\n잠시만요, 가까운 병원을 찾아드릴게요.",
    retryReply:
      "통증이 어느 정도인지 알려주세요.\n예: ‘조금 불편해요’, ‘많이 아파요’",
    isFinal: true,
  },
];

/**
 * 사용자 입력이 해당 턴의 예시와 매칭되는지 검사.
 * - 최소 2자 이상
 * - keywords 중 하나라도 포함 → 통과
 */
export function matchesTurn(input: string, turn: TutorialChatTurn): boolean {
  const normalized = input.trim();
  if (normalized.length < 2) return false;
  return turn.keywords.some((kw) => normalized.includes(kw));
}

// ─── 2) 병원 추천 결과 mock ───

/** 충청북도 청주시 (학교 근처 가정) 좌표 기준 임시 병원 3개 */
export const TUTORIAL_HOSPITAL_RESULT: RecommendResponse = {
  department: "정형외과",
  departmentCode: "OS",
  secondaryDepartment: "신경외과",
  confidence: 0.91,
  reason:
    "허리 통증이 며칠간 지속되는 경우 정형외과 진료를 받으시는 것이 좋습니다.",
  hospitals: [
    {
      name: "튜토리얼 정형외과의원",
      address: "충북 청주시 흥덕구 가경로 123",
      tel: "043-000-0001",
      latitude: 36.6395,
      longitude: 127.4214,
      distanceMeters: 320,
      isOpenNow: true,
      score: 0.95,
    },
    {
      name: "연습용 척추병원",
      address: "충북 청주시 흥덕구 사직대로 456",
      tel: "043-000-0002",
      latitude: 36.6412,
      longitude: 127.4258,
      distanceMeters: 780,
      isOpenNow: true,
      score: 0.88,
    },
    {
      name: "예시 통증의학과",
      address: "충북 청주시 흥덕구 비하로 789",
      tel: "043-000-0003",
      latitude: 36.6371,
      longitude: 127.4188,
      distanceMeters: 1200,
      isOpenNow: false,
      score: 0.82,
    },
  ],
  userLatitude: 36.6403,
  userLongitude: 127.4228,
  locationSource: "REQUEST",
};

// ─── 3) 대중교통 길안내 mock ───
// 실제 백엔드 BackendTransitResponse 형태와 호환되는 간단한 mock.

export const TUTORIAL_TRANSIT_RESULT = {
  totalTime: 18 * 60, // 18분
  totalDistance: 2400, // 2.4km
  totalFare: 1500,
  totalWalkDistance: 350,
  transferCount: 0,
  cards: [
    {
      type: "WALK" as const,
      distance: 200,
      duration: 240, // 4분
      description: "정류장까지 걸어가요",
    },
    {
      type: "BUS" as const,
      busNumber: "115",
      busType: "일반",
      startStopName: "튜토리얼 정류장",
      endStopName: "병원앞 정류장",
      passStopCount: 4,
      duration: 600, // 10분
    },
    {
      type: "WALK" as const,
      distance: 150,
      duration: 180, // 3분
      description: "병원까지 걸어가요",
    },
  ],
};

// ─── 4) 화면별 가이드 텍스트 ───

export const TUTORIAL_HINTS = {
  home: "‘병원 찾기’를 눌러 보세요.\n증상을 말하면 가까운 병원을 알려드려요.",
  chat_typing: "글로 적거나 마이크를 눌러 말씀해 보세요.",
  chat_final: "잠시만 기다려 주세요.\n곧 병원 목록이 나와요.",
  result: "마음에 드는 병원을 골라\n‘길안내’를 눌러 보세요.",
  modal: "‘도보’ 또는 ‘대중교통’ 중\n원하는 방법을 선택해 보세요.",
  navigation_walking:
    "걸어서 가는 길을 알려드려요.\n경로를 확인하시고 아래 ‘완료’를 눌러 보세요.",
  navigation_transit:
    "버스나 지하철 정보를 알려드려요.\n경로를 확인하시고 아래 ‘완료’를 눌러 보세요.",
  medication_home:
    "‘오늘의 약’을 눌러 보세요.\n약을 추가하고 확인할 수 있어요.",
  medication_today: "‘복약 일정 추가하기’를 눌러 보세요.",
  medication:
    "약을 추가하는 화면이에요.\n약 정보를 확인하고 ‘저장’을 눌러 보세요.",
  medication_done: "잘 하셨어요!\n이렇게 약을 추가하시면 돼요.",
  complete: "수고하셨어요!\n이제 실제로 한번 사용해 보세요.",
} as const;
