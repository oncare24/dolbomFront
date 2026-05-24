// ============================================================
// 고령자용 안내 문장 생성
// ============================================================
// Tmap 원문(시계방향·미터·복합문)을 어르신 말로 변환.
//  - 시계방향(8/10/2/4시) → 왼쪽/오른쪽
//  - 랜드마크(시설/POI/교차로명)를 기준점으로
//  - 한 번에 한 동작

type Dir = "left" | "right" | "straight" | "uturn" | null;

const LEFT = new Set([12, 16, 17, 212, 214, 215]);
const RIGHT = new Set([13, 18, 19, 213, 216, 217]);
const STRAIGHT = new Set([11, 211, 233]);

const FACILITY: Record<number, string> = {
  125: "육교",
  126: "지하보도",
  127: "계단",
  128: "경사로",
  218: "엘리베이터",
};

export function seniorDirection(turnType: number): Dir {
  if (LEFT.has(turnType)) return "left";
  if (RIGHT.has(turnType)) return "right";
  if (STRAIGHT.has(turnType)) return "straight";
  if (turnType === 14) return "uturn";
  return null;
}

function isCrosswalk(turnType: number): boolean {
  return (turnType >= 211 && turnType <= 217) || turnType === 233;
}

/** 카드 큰 글씨용 짧은 행동 라벨 */
export function buildSeniorActionLabel(turnType: number): string {
  if (turnType === 200) return "출발";
  if (turnType === 201) return "도착";
  if (FACILITY[turnType]) return FACILITY[turnType];
  if (isCrosswalk(turnType)) return "횡단보도";
  const dir = seniorDirection(turnType);
  if (dir === "left") return "왼쪽으로";
  if (dir === "right") return "오른쪽으로";
  if (dir === "uturn") return "뒤로 돌기";
  if (dir === "straight") return "직진";
  return "안내";
}

/** TTS + 카드 보조문구용 한 문장 */
export function buildSeniorSpeech(turnType: number, landmark: string): string {
  const where = landmark.trim();

  if (turnType === 200) return "안내를 시작합니다. 화면을 따라 출발하세요.";
  if (turnType === 201) return "곧 도착합니다.";

  if (FACILITY[turnType]) {
    const f = FACILITY[turnType];
    if (f === "엘리베이터") return "엘리베이터를 타세요.";
    if (f === "육교") return "육교를 건너세요.";
    return `${f}로 가세요.`;
  }

  if (isCrosswalk(turnType)) {
    const dir = seniorDirection(turnType);
    const side = dir === "left" ? "왼쪽 " : dir === "right" ? "오른쪽 " : "";
    return where
      ? `${where} 앞에서 ${side}횡단보도를 건너세요.`
      : `${side}횡단보도를 건너세요.`;
  }

  const dir = seniorDirection(turnType);
  if (dir === "left" || dir === "right") {
    const side = dir === "left" ? "왼쪽" : "오른쪽";
    return where ? `${where}에서 ${side}으로 도세요.` : `${side}으로 도세요.`;
  }
  if (dir === "uturn") return "뒤로 돌아 가세요.";
  if (dir === "straight") {
    return where ? `${where} 쪽으로 쭉 가세요.` : "앞으로 쭉 가세요.";
  }
  return "안내를 따라가세요.";
}
