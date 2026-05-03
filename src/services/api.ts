// axios 인스턴스 + 인터셉터 (토큰 자동부착, 401 자동재발급, ApiResponse unwrap, 전역 에러 Toast)

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../stores/authStore";
import { toastBridge } from "../utils/toastBridge";

// .env의 EXPO_PUBLIC_API_BASE_URL 사용. 빌드 타임에 주입되며, 끝 슬래시는 자동 제거.
// 안드로이드 에뮬레이터에서는 PC IP 대신 http://10.0.2.2:8080 사용.
const RAW_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.0.6:8080";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");
// ───────────────────────────────────────────────────────
// 백엔드 ApiResponse 형태 (모두 type alias로 통일 → IDE 오인식 차단)
// ───────────────────────────────────────────────────────
type ApiSuccessBody<T> = { success: true; data: T };
type ApiErrorBody = {
  success: false;
  error: { code: string; message: string };
};
type ApiBody<T> = ApiSuccessBody<T> | ApiErrorBody;

// refresh 응답 전용 타입
type ReissueBody = ApiSuccessBody<{
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}>;

// 화면에서 catch할 때 쓰는 표준 에러
export class ApiException extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiException";
  }
}

// ───────────────────────────────────────────────────────
// axios 인스턴스
// ───────────────────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ─── 요청 인터셉터: accessToken 자동 부착 ───
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── refresh 동시 호출 방지용 큐 ───
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function onTokenRefreshed(newToken: string) {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
}

// ─── 응답 인터셉터: success unwrap + 401 자동 재발급 + 전역 에러 Toast ───
api.interceptors.response.use(
  (response) => {
    const body = response.data as ApiBody<unknown>;
    if (body && typeof body === "object" && "success" in body) {
      if (body.success === true) {
        return { ...response, data: body.data };
      }
      throw new ApiException(
        body.error.code,
        body.error.message,
        response.status,
      );
    }
    return response;
  },

  async (error: AxiosError<ApiBody<unknown>>) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;
    const body = error.response?.data;
    const errCode =
      body && typeof body === "object" && "error" in body
        ? (body as ApiErrorBody).error.code
        : undefined;
    const errMessage =
      body && typeof body === "object" && "error" in body
        ? (body as ApiErrorBody).error.message
        : error.message;

    // ─── 401 + 만료 토큰 → 자동 재발급 후 원요청 재시도 ───
    if (status === 401 && errCode === "A003" && !original._retry) {
      original._retry = true;

      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) {
        useAuthStore.getState().logout();
        toastBridge.show("다시 로그인해주세요", "warning");
        return Promise.reject(
          new ApiException("A005", "로그인이 만료되었어요", 401),
        );
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((newToken) => {
            if (original.headers) {
              original.headers.Authorization = `Bearer ${newToken}`;
            }
            api.request(original).then(resolve).catch(reject);
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshRes = await axios.post<ReissueBody>(
          `${BASE_URL}/api/auth/reissue`,
          { refreshToken },
        );

        const newTokens = refreshRes.data.data;
        useAuthStore
          .getState()
          .updateTokens(newTokens.accessToken, newTokens.refreshToken);

        onTokenRefreshed(newTokens.accessToken);
        if (original.headers) {
          original.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        }
        return api.request(original);
      } catch (refreshErr) {
        useAuthStore.getState().logout();
        toastBridge.show("다시 로그인해주세요", "warning");
        return Promise.reject(
          new ApiException("A005", "로그인이 만료되었어요", 401),
        );
      } finally {
        isRefreshing = false;
      }
    }

    // ─── 401 (재발급 불가능 케이스: A001, A002 등) ───
    if (status === 401) {
      useAuthStore.getState().logout();
      toastBridge.show("다시 로그인해주세요", "warning");
    }
    // ─── 5xx → 자동 Toast ───
    else if (status && status >= 500) {
      toastBridge.show("서버에 일시적인 문제가 있어요", "error");
    }
    // ─── 응답 없음 → 네트워크 끊김 또는 타임아웃 ───
    else if (!error.response) {
      if (error.code === "ECONNABORTED") {
        toastBridge.show("응답이 느려요. 잠시 후 다시 시도해주세요", "error");
      } else {
        toastBridge.show("인터넷 연결을 확인해주세요", "error");
      }
    }

    return Promise.reject(
      new ApiException(
        errCode ?? "C003",
        errMessage ?? "요청에 실패했어요",
        status,
      ),
    );
  },
);
