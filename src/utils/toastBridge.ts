// axios 인터셉터처럼 React 바깥에서 Toast를 띄우기 위한 브리지.
// App.tsx의 Toast 영역 안쪽 컴포넌트가 useToast().show를 등록해두면,
// 어디서든 toastBridge.show(...)로 호출 가능.
//
// 사용:
//   - 등록: App.tsx 내부에서 registerToast(toast.show)
//   - 호출: api.ts 인터셉터에서 toastBridge.show("메시지", "error")

type ToastVariant = "success" | "error" | "info" | "warning";
type ToastFn = (params: { message: string; variant?: ToastVariant }) => void;

let toastFn: ToastFn | null = null;

export function registerToast(fn: ToastFn) {
  toastFn = fn;
}

export const toastBridge = {
  show(message: string, variant: ToastVariant = "info") {
    toastFn?.({ message, variant });
  },
};
