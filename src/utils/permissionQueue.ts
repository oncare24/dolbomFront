// 권한 요청 직렬화 큐.
//
// 안드로이드는 권한 팝업을 한 번에 하나만 띄운다.
// 알림·위치 요청이 동시에 날아가면 하나만 뜨고 나머지는 조용히 무시돼서,
// "첫 실행엔 알림만, 다시 켜야 위치" 현상이 생긴다.
// 모든 권한 요청을 이 큐에 통과시키면 팝업이 하나씩 순서대로 뜬다.

let tail: Promise<unknown> = Promise.resolve();

export function requestInSequence<T>(task: () => Promise<T>): Promise<T> {
  const run = tail.then(task, task);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
