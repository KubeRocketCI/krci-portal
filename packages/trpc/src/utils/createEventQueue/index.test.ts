import { describe, expect, test, vi } from "vitest";
import { createEventQueue, yieldEvents } from "./index.js";

describe("createEventQueue", () => {
  test("creates queue with initial empty state", () => {
    const queue = createEventQueue<string>();

    expect(queue.isEmpty()).toBe(true);
    expect(queue.isAborted).toBe(false);
  });

  test("emits events and adds them to queue", () => {
    const queue = createEventQueue<string>();

    queue.emit("event1");
    queue.emit("event2");

    expect(queue.isEmpty()).toBe(false);
    expect(queue.shift()).toBe("event1");
    expect(queue.shift()).toBe("event2");
    expect(queue.isEmpty()).toBe(true);
  });

  test("emits errors and adds them to queue", () => {
    const queue = createEventQueue<string, Error>();

    const error = new Error("test error");
    queue.emitError(error);

    expect(queue.isEmpty()).toBe(false);
    const event = queue.shift();
    expect(event).toHaveProperty("error");
    expect((event as { error: Error }).error).toBe(error);
  });

  test("abort sets isAborted flag", () => {
    const queue = createEventQueue<string>();

    queue.abort();

    expect(queue.isAborted).toBe(true);
  });

  test("abort prevents further events", () => {
    const queue = createEventQueue<string>();

    queue.abort();
    queue.emit("event1");

    expect(queue.isEmpty()).toBe(true);
  });

  test("waitForNext resolves when queue has items", async () => {
    const queue = createEventQueue<string>();

    queue.emit("event1");

    await expect(queue.waitForNext()).resolves.toBeUndefined();
  });

  test("waitForNext resolves when signal is aborted", async () => {
    const queue = createEventQueue<string>();
    const controller = new AbortController();

    controller.abort();

    await expect(queue.waitForNext(controller.signal)).resolves.toBeUndefined();
  });
});

describe("yieldEvents", () => {
  test("yields events from queue", async () => {
    const queue = createEventQueue<string>();

    // Start consuming events
    const eventsPromise = (async () => {
      const events: string[] = [];
      for await (const event of yieldEvents(queue)) {
        events.push(event);
      }
      return events;
    })();

    // Emit events after starting consumption
    queue.emit("event1");
    queue.emit("event2");
    queue.abort();

    const events = await eventsPromise;
    expect(events).toEqual(["event1", "event2"]);
  });

  test("throws error when error event is encountered", async () => {
    const queue = createEventQueue<string, Error>();

    const consumePromise = (async () => {
      for await (const _event of yieldEvents(queue)) {
        // Should not reach here
      }
    })();

    queue.emitError(new Error("test error"));
    queue.abort();

    await expect(consumePromise).rejects.toThrow("test error");
  });

  test("uses custom error handler", async () => {
    const queue = createEventQueue<string, Error>();
    const customError = new Error("custom error");
    const handleError = vi.fn(() => customError);

    const consumePromise = (async () => {
      for await (const _event of yieldEvents(queue, undefined, handleError)) {
        // Should not reach here
      }
    })();

    queue.emitError(new Error("original error"));
    queue.abort();

    await expect(consumePromise).rejects.toThrow("custom error");
    expect(handleError).toHaveBeenCalled();
  });

  test("respects abort signal", async () => {
    const queue = createEventQueue<string>();
    const controller = new AbortController();

    const eventsPromise = (async () => {
      const events: string[] = [];
      for await (const event of yieldEvents(queue, controller.signal)) {
        events.push(event);
        // Abort after getting first event
        controller.abort();
      }
      return events;
    })();

    queue.emit("event1");
    queue.emit("event2"); // This should not be yielded due to abort
    queue.abort();

    const events = await eventsPromise;
    // Should only get event1 before abort
    expect(events).toEqual(["event1"]);
  });

  test("handles multiple events in sequence", async () => {
    const queue = createEventQueue<number>();

    const eventsPromise = (async () => {
      const events: number[] = [];
      for await (const event of yieldEvents(queue)) {
        events.push(event);
      }
      return events;
    })();

    queue.emit(1);
    queue.emit(2);
    queue.emit(3);
    queue.abort();

    const events = await eventsPromise;
    expect(events).toEqual([1, 2, 3]);
  });
});
