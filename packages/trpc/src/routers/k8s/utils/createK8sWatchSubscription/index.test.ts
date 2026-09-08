import { describe, expect, test, vi, beforeEach } from "vitest";
import { createK8sWatchSubscription, WatchEvent } from "./index.js";
import type { Watch } from "@kubernetes/client-node";
import { K8sApiError, type KubeObjectBase } from "@my-project/shared";

// Mock dependencies
vi.mock("../handleK8sError/index.js", () => ({
  handleK8sError: (err: Error) => err,
}));

vi.mock("../../../../utils/createEventQueue/index.js", () => {
  const actual = vi.importActual("../../../../utils/createEventQueue/index.js");
  return actual;
});

describe("createK8sWatchSubscription", () => {
  let mockWatch: Watch;
  let mockController: { abort: ReturnType<typeof vi.fn> };
  let watchCallback: (type: string, obj: KubeObjectBase) => void;
  let errorCallback: (err?: Error) => void;

  beforeEach(() => {
    mockController = {
      abort: vi.fn(),
    };

    mockWatch = {
      watch: vi.fn((url, options, onEvent, onError) => {
        watchCallback = onEvent;
        errorCallback = onError;
        return Promise.resolve(mockController);
      }),
    } as unknown as Watch;
  });

  test("yields events from kubernetes watch", async () => {
    const events: WatchEvent[] = [];

    const generator = createK8sWatchSubscription(mockWatch, {
      watchUrl: "/api/v1/pods",
      watchOptions: { resourceVersion: "1000" },
    });

    // Start consuming the generator
    const consumerPromise = (async () => {
      for await (const event of generator) {
        events.push(event);
        if (events.length === 2) break;
      }
    })();

    // Wait a bit for watch to be set up
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Emit some events
    watchCallback("ADDED", { metadata: { name: "pod1" } } as KubeObjectBase);
    watchCallback("MODIFIED", { metadata: { name: "pod2" } } as KubeObjectBase);

    await consumerPromise;

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      type: "ADDED",
      data: { metadata: { name: "pod1" } },
    });
    expect(events[1]).toEqual({
      type: "MODIFIED",
      data: { metadata: { name: "pod2" } },
    });

    expect(mockWatch.watch).toHaveBeenCalledWith(
      "/api/v1/pods",
      { resourceVersion: "1000" },
      expect.any(Function),
      expect.any(Function)
    );
  });

  // Drives the generator until the done callback makes it throw, and returns what it threw.
  const emitDoneError = async (err: unknown) => {
    const generator = createK8sWatchSubscription(mockWatch, {
      watchUrl: "/api/v1/pods",
      watchOptions: { resourceVersion: "1000" },
    });

    const consumerPromise = (async () => {
      try {
        for await (const _event of generator) {
          // Should not reach here
        }
      } catch (thrown) {
        return thrown;
      }
    })();

    // Wait a bit for watch to be set up
    await new Promise((resolve) => setTimeout(resolve, 10));

    errorCallback(err as Error);

    return consumerPromise;
  };

  test("handles watch errors", async () => {
    const error = await emitDoneError(new Error("Watch error"));

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Watch error");
  });

  test("cleans up controller on abort signal", async () => {
    const controller = new AbortController();

    const generator = createK8sWatchSubscription(mockWatch, {
      watchUrl: "/api/v1/pods",
      watchOptions: { resourceVersion: "1000" },
      signal: controller.signal,
    });

    const events: WatchEvent[] = [];

    const consumerPromise = (async () => {
      for await (const event of generator) {
        events.push(event);
      }
    })();

    // Wait a bit for watch to be set up
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Emit one event
    watchCallback("ADDED", { metadata: { name: "pod1" } } as KubeObjectBase);

    // Wait for event to be processed
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Abort the signal
    controller.abort();

    await consumerPromise;

    expect(events).toHaveLength(1);
    expect(mockController.abort).toHaveBeenCalled();
  });

  test("handles fieldSelector in watch options", async () => {
    const generator = createK8sWatchSubscription(mockWatch, {
      watchUrl: "/api/v1/pods",
      watchOptions: {
        resourceVersion: "1000",
        fieldSelector: "metadata.name=test-pod",
      },
    });

    const consumerPromise = (async () => {
      for await (const _event of generator) {
        break;
      }
    })();

    // Wait a bit for watch to be set up
    await new Promise((resolve) => setTimeout(resolve, 10));

    watchCallback("ADDED", { metadata: { name: "test-pod" } } as KubeObjectBase);

    await consumerPromise;

    expect(mockWatch.watch).toHaveBeenCalledWith(
      "/api/v1/pods",
      {
        resourceVersion: "1000",
        fieldSelector: "metadata.name=test-pod",
      },
      expect.any(Function),
      expect.any(Function)
    );
  });

  test("cleans up on generator completion", async () => {
    const generator = createK8sWatchSubscription(mockWatch, {
      watchUrl: "/api/v1/pods",
      watchOptions: { resourceVersion: "1000" },
    });

    const consumerPromise = (async () => {
      for await (const _event of generator) {
        break; // Exit early to trigger cleanup
      }
    })();

    // Wait a bit for watch to be set up
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Emit an event
    watchCallback("ADDED", { metadata: { name: "pod1" } } as KubeObjectBase);

    await consumerPromise;

    // Controller should be aborted
    expect(mockController.abort).toHaveBeenCalled();
  });

  test("handles watch promise rejection", async () => {
    const mockFailingWatch = {
      watch: vi.fn(() => Promise.reject(new Error("Watch setup failed"))),
    } as unknown as Watch;

    const generator = createK8sWatchSubscription(mockFailingWatch, {
      watchUrl: "/api/v1/pods",
      watchOptions: { resourceVersion: "1000" },
    });

    const error = await (async () => {
      try {
        for await (const _event of generator) {
          // Should not reach here
        }
      } catch (err) {
        return err;
      }
    })();

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Watch setup failed");
  });

  test("does not emit events if queue is aborted", async () => {
    const controller = new AbortController();
    controller.abort(); // Abort before starting

    const generator = createK8sWatchSubscription(mockWatch, {
      watchUrl: "/api/v1/pods",
      watchOptions: { resourceVersion: "1000" },
      signal: controller.signal,
    });

    const events: WatchEvent[] = [];

    for await (const event of generator) {
      events.push(event);
    }

    expect(events).toHaveLength(0);
  });

  test("restarts watch on clean termination with updated resourceVersion", async () => {
    let watchCallCount = 0;

    const mockRestartWatch = {
      watch: vi.fn((url, options, onEvent, onDone) => {
        watchCallCount++;
        watchCallback = onEvent;
        errorCallback = onDone;
        return Promise.resolve(mockController);
      }),
    } as unknown as Watch;

    const controller = new AbortController();

    const generator = createK8sWatchSubscription(mockRestartWatch, {
      watchUrl: "/api/v1/pods",
      watchOptions: { resourceVersion: "1000" },
      signal: controller.signal,
    });

    const events: WatchEvent[] = [];

    const consumerPromise = (async () => {
      for await (const event of generator) {
        events.push(event);
        if (events.length === 3) {
          controller.abort();
        }
      }
    })();

    // Wait for first watch to be set up
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(watchCallCount).toBe(1);

    // Emit event with resourceVersion, then trigger clean termination
    watchCallback("ADDED", { metadata: { name: "pod1", resourceVersion: "2000" } } as KubeObjectBase);
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Clean termination (K8s watch timeout) — done called with null
    errorCallback(null as unknown as Error);

    // Wait for watch to restart
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(watchCallCount).toBe(2);

    // Verify the second watch was started with the updated resourceVersion
    expect(mockRestartWatch.watch).toHaveBeenLastCalledWith(
      "/api/v1/pods",
      { resourceVersion: "2000" },
      expect.any(Function),
      expect.any(Function)
    );

    // Emit events on the restarted watch
    watchCallback("MODIFIED", { metadata: { name: "pod1", resourceVersion: "3000" } } as KubeObjectBase);
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Clean termination again
    errorCallback(null as unknown as Error);

    // Wait for third watch to start
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(watchCallCount).toBe(3);

    // Third watch should use the latest resourceVersion
    expect(mockRestartWatch.watch).toHaveBeenLastCalledWith(
      "/api/v1/pods",
      { resourceVersion: "3000" },
      expect.any(Function),
      expect.any(Function)
    );

    // Emit final event and abort
    watchCallback("DELETED", { metadata: { name: "pod1", resourceVersion: "4000" } } as KubeObjectBase);

    await consumerPromise;

    expect(events).toHaveLength(3);
    expect(events[0].type).toBe("ADDED");
    expect(events[1].type).toBe("MODIFIED");
    expect(events[2].type).toBe("DELETED");
  });

  test("handles 410 Gone by resetting resourceVersion and restarting watch", async () => {
    let watchCallCount = 0;

    const mockGoneWatch = {
      watch: vi.fn((url, options, onEvent, onDone) => {
        watchCallCount++;
        watchCallback = onEvent;
        errorCallback = onDone;
        return Promise.resolve(mockController);
      }),
    } as unknown as Watch;

    const controller = new AbortController();

    const generator = createK8sWatchSubscription(mockGoneWatch, {
      watchUrl: "/api/v1/pods",
      watchOptions: { resourceVersion: "1000" },
      signal: controller.signal,
    });

    const events: WatchEvent[] = [];

    const consumerPromise = (async () => {
      for await (const event of generator) {
        events.push(event);
        if (events.length === 2) {
          controller.abort();
        }
      }
    })();

    // Wait for first watch to be set up
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(watchCallCount).toBe(1);

    // Emit event, then simulate 410 Gone
    watchCallback("ADDED", { metadata: { name: "pod1", resourceVersion: "2000" } } as KubeObjectBase);
    await new Promise((resolve) => setTimeout(resolve, 10));

    // 410 Gone — resourceVersion expired
    const goneError = new Error("Gone") as Error & { statusCode: number };
    goneError.statusCode = 410;
    errorCallback(goneError);

    // Wait for watch to restart
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(watchCallCount).toBe(2);

    // Verify the restarted watch uses empty resourceVersion (fresh start)
    expect(mockGoneWatch.watch).toHaveBeenLastCalledWith(
      "/api/v1/pods",
      { resourceVersion: "" },
      expect.any(Function),
      expect.any(Function)
    );

    // Emit event on restarted watch and abort
    watchCallback("MODIFIED", { metadata: { name: "pod1", resourceVersion: "5000" } } as KubeObjectBase);

    await consumerPromise;

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("ADDED");
    expect(events[1].type).toBe("MODIFIED");
  });

  test("yields multiple events in sequence", async () => {
    const generator = createK8sWatchSubscription(mockWatch, {
      watchUrl: "/api/v1/pods",
      watchOptions: { resourceVersion: "1000" },
    });

    const events: WatchEvent[] = [];

    const consumerPromise = (async () => {
      for await (const event of generator) {
        events.push(event);
        if (events.length === 3) break;
      }
    })();

    // Wait a bit for watch to be set up
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Emit multiple events
    watchCallback("ADDED", { metadata: { name: "pod1" } } as KubeObjectBase);
    watchCallback("MODIFIED", { metadata: { name: "pod2" } } as KubeObjectBase);
    watchCallback("DELETED", { metadata: { name: "pod3" } } as KubeObjectBase);

    await consumerPromise;

    expect(events).toHaveLength(3);
    expect(events[0].type).toBe("ADDED");
    expect(events[1].type).toBe("MODIFIED");
    expect(events[2].type).toBe("DELETED");
  });

  describe("preserves the HTTP status of a watch error", () => {
    // handleK8sError is mocked to identity above, so the generator surfaces the
    // error this module emits. The real mapper is imported to assert the code
    // that reaches the wire.
    const mapToTRPCError = async (error: unknown) => {
      const { handleK8sError } =
        await vi.importActual<typeof import("../handleK8sError/index.js")>("../handleK8sError/index.js");
      return handleK8sError(error);
    };

    const withStatusCode = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode });

    test("a watch on a type the cluster does not serve maps to NOT_FOUND", async () => {
      const error = await emitDoneError(withStatusCode("Not Found", 404));

      expect(error).toBeInstanceOf(K8sApiError);
      expect((error as K8sApiError).statusCode).toBe(404);
      expect((error as K8sApiError).statusText).toBe("Not Found");
      expect((await mapToTRPCError(error)).code).toBe("NOT_FOUND");
    });

    test("a watch denied by RBAC maps to FORBIDDEN", async () => {
      const error = await emitDoneError(withStatusCode("Forbidden", 403));

      expect(error).toBeInstanceOf(K8sApiError);
      expect((error as K8sApiError).statusCode).toBe(403);
      expect((await mapToTRPCError(error)).code).toBe("FORBIDDEN");
    });

    test("reads a numeric code from a K8s Status object", async () => {
      const error = await emitDoneError(Object.assign(new Error("Not Found"), { code: 404 }));

      expect(error).toBeInstanceOf(K8sApiError);
      expect((error as K8sApiError).statusCode).toBe(404);
    });

    test("an error without a status is emitted unchanged and maps to INTERNAL_SERVER_ERROR", async () => {
      const original = new Error("Watch stream failed");
      const error = await emitDoneError(original);

      expect(error).toBe(original);
      expect(error).not.toBeInstanceOf(K8sApiError);
      expect((await mapToTRPCError(error)).code).toBe("INTERNAL_SERVER_ERROR");
    });

    test("does not read a string transport code as a status", async () => {
      const original = Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
      const error = await emitDoneError(original);

      expect(error).toBe(original);
      expect(error).not.toBeInstanceOf(K8sApiError);
      expect((await mapToTRPCError(error)).code).toBe("INTERNAL_SERVER_ERROR");
    });
  });
});
