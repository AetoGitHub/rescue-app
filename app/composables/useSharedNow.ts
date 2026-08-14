const BOARD_NOW_INTERVAL_MS = 30_000;

const now = shallowRef(new Date());
let subscriberCount = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;

/** Single clock for SLA/chat badges so kanban cards do not each own a timer. */
export function useSharedNow() {
  if (import.meta.client) {
    subscriberCount += 1;

    if (intervalId == null) {
      intervalId = setInterval(() => {
        now.value = new Date();
      }, BOARD_NOW_INTERVAL_MS);
    }

    onScopeDispose(() => {
      subscriberCount -= 1;
      if (subscriberCount <= 0 && intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
        subscriberCount = 0;
      }
    });
  }

  return now;
}
