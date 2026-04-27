// ============================================================
// STT 추상화 계층
// ============================================================
// 현재: @jamsch/expo-speech-recognition (Google on-device, 무료, 즉시 동작)
// 추후: CLOVA Speech (Naver, 백엔드 중계, 노인 발화 정확도 ↑)
//
// 화면(ChatInputBar)은 sttService 명령부 + useSttRecognition 훅만 import.
// 마이그레이션 시 이 파일 내부만 교체하면 화면 코드 0줄 변경.

import { useState } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "@jamsch/expo-speech-recognition";

// ── 명령형 컨트롤 (start/stop/permission) ──

export const sttService = {
  /** 권한 요청. 거부 시 false 반환. */
  async requestPermission(): Promise<boolean> {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return result.granted;
  },

  /** 음성 인식 시작. interimResults=true로 실시간 미리보기 활성. */
  start(lang: string = "ko-KR") {
    ExpoSpeechRecognitionModule.start({
      lang,
      interimResults: true,
      continuous: false, // 사용자가 말 멈추면 자동 종료
      requiresOnDeviceRecognition: false,
    });
  },

  /** 인식 종료 (지금까지 결과 final 처리) */
  stop() {
    ExpoSpeechRecognitionModule.stop();
  },

  /** 인식 즉시 취소 (결과 무시) */
  abort() {
    ExpoSpeechRecognitionModule.abort();
  },
};

// ── 결과 구독 훅 ──
// 마이그레이션 시 이 훅의 내부만 CLOVA WebSocket/REST 응답 처리로 교체.

export interface SttRecognitionState {
  isListening: boolean;
  error: string | null;
}

interface UseSttRecognitionOptions {
  /** 결과 콜백. isFinal=true면 사용자가 말 마침 → 화면이 입력칸에 확정 텍스트 채움. */
  onResult: (text: string, isFinal: boolean) => void;
  /** 에러 콜백 (권한, 네트워크, 인식 실패 등) */
  onError?: (error: string, message: string) => void;
}

export function useSttRecognition(
  options: UseSttRecognitionOptions,
): SttRecognitionState {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSpeechRecognitionEvent("start", () => {
    setIsListening(true);
    setError(null);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript ?? "";
    const isFinal = event.isFinal ?? false;
    if (transcript) {
      options.onResult(transcript, isFinal);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    const errCode = event.error ?? "unknown";
    const errMsg = event.message ?? "";
    setError(errCode);
    setIsListening(false);
    options.onError?.(errCode, errMsg);
  });

  return { isListening, error };
}
