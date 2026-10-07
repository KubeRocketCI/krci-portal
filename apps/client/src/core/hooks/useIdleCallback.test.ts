import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDLE_CALLBACK_TIMEOUT_MS, useIdleCallback } from "./useIdleCallback";

describe("useIdleCallback", () => {
  afterEach(() => {
    // Unmount while the stubs are in place.
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("with requestIdleCallback", () => {
    let idleCallbacks: Map<number, () => void>;
    const requestIdleCallback = vi.fn();
    const cancelIdleCallback = vi.fn();

    beforeEach(() => {
      idleCallbacks = new Map();
      let nextHandle = 1;
      requestIdleCallback.mockReset().mockImplementation((cb: () => void) => {
        const handle = nextHandle++;
        idleCallbacks.set(handle, cb);
        return handle;
      });
      cancelIdleCallback.mockReset().mockImplementation((handle: number) => idleCallbacks.delete(handle));
      vi.stubGlobal("requestIdleCallback", requestIdleCallback);
      vi.stubGlobal("cancelIdleCallback", cancelIdleCallback);
    });

    const runIdle = () => {
      const pending = [...idleCallbacks.values()];
      idleCallbacks.clear();
      pending.forEach((cb) => cb());
    };

    it("runs the callback when idle, with a timeout", () => {
      const callback = vi.fn();
      renderHook(() => useIdleCallback(callback, true));

      expect(callback).not.toHaveBeenCalled();
      expect(requestIdleCallback).toHaveBeenCalledWith(callback, { timeout: IDLE_CALLBACK_TIMEOUT_MS });

      runIdle();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("schedules nothing while disabled, then schedules once enabled", () => {
      const callback = vi.fn();
      const { rerender } = renderHook(({ enabled }) => useIdleCallback(callback, enabled), {
        initialProps: { enabled: false },
      });

      expect(requestIdleCallback).not.toHaveBeenCalled();

      rerender({ enabled: true });
      runIdle();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("cancels on unmount", () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() => useIdleCallback(callback, true));

      unmount();
      runIdle();

      expect(cancelIdleCallback).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();
    });

    it("cancels when disabled before idle", () => {
      const callback = vi.fn();
      const { rerender } = renderHook(({ enabled }) => useIdleCallback(callback, enabled), {
        initialProps: { enabled: true },
      });

      rerender({ enabled: false });
      runIdle();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("without requestIdleCallback", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.stubGlobal("requestIdleCallback", undefined);
    });

    it("runs the callback on the next task", () => {
      const callback = vi.fn();
      renderHook(() => useIdleCallback(callback, true));

      expect(callback).not.toHaveBeenCalled();

      vi.runAllTimers();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("cancels on unmount", () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() => useIdleCallback(callback, true));

      unmount();
      vi.runAllTimers();

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
