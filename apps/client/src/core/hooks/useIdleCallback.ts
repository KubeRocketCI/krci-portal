import { useEffect } from "react";

/** Upper bound for the wait on a busy main thread. */
export const IDLE_CALLBACK_TIMEOUT_MS = 2000;

/**
 * Runs `callback` once when the browser is idle after `enabled` turns true.
 * `setTimeout(0)` where `requestIdleCallback` is missing (Safari).
 * Cancelled on unmount, when `enabled` turns false and in a hidden `<Activity>`; a new `callback` identity reschedules.
 */
export function useIdleCallback(callback: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(callback, { timeout: IDLE_CALLBACK_TIMEOUT_MS });
      return () => window.cancelIdleCallback(handle);
    }

    const handle = setTimeout(callback, 0);
    return () => clearTimeout(handle);
  }, [callback, enabled]);
}
