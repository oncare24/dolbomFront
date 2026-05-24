// 튜토리얼 음성 안내 (TTS).
// expo-speech를 사용해 시스템 내장 음성으로 텍스트를 읽음.
// 네트워크 안 타고, 한국어 음성 자동 사용.

import * as Speech from "expo-speech";

const DEFAULT_OPTIONS: Speech.SpeechOptions = {
  language: "ko-KR",
  rate: 0.9, // 노인 친화 — 살짝 천천히
  pitch: 1.0,
};

/**
 * 새 텍스트를 읽음. 이전에 읽고 있던 게 있으면 중단하고 새로 시작.
 * - 이모지/특수문자는 자동 제거 (시스템 음성이 어색하게 읽지 않도록)
 * - onDone: 발화가 끝나면 호출 (안드로이드/iOS 지원). 빈 문자열이면 즉시 호출.
 */
export function speak(text: string, onDone?: () => void): void {
  // 이모지 및 특수 마크 제거
  const cleaned = text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // 기본 이모지 범위
    .replace(/[🎤📚📍📞🚶🏥]/g, "")
    .replace(/['']/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    onDone?.();
    return;
  }

  // 이전 발화 중단
  Speech.stop();
  Speech.speak(cleaned, { ...DEFAULT_OPTIONS, onDone });
}

/** 발화 중단. 화면 이탈 시 호출. */
export function stop(): void {
  Speech.stop();
}

/** 현재 발화 중인지 확인 (필요시 사용). */
export async function isSpeaking(): Promise<boolean> {
  return await Speech.isSpeakingAsync();
}
