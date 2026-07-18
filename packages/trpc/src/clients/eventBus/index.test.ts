import { afterEach, describe, expect, it, vi } from "vitest";
import type { NotificationEvent } from "@my-project/shared";
import { notificationEventBus } from "./index.js";

const EVENT: NotificationEvent = {
  id: "evt-1",
  type: "pipelinerun.failed",
  severity: "error",
  title: "Build pipeline failed",
  body: "PipelineRun failed in namespace krci",
  namespace: "krci",
  timestamp: "2026-07-18T10:00:00Z",
};

describe("notificationEventBus", () => {
  const listeners: Array<(event: NotificationEvent) => void> = [];

  afterEach(() => {
    // Process-wide singleton — always detach what a test attached.
    for (const listener of listeners.splice(0)) {
      notificationEventBus.offNotification(listener);
    }
  });

  function attach(listener: (event: NotificationEvent) => void) {
    listeners.push(listener);
    notificationEventBus.onNotification(listener);
  }

  it("fans a published event out to every registered listener", () => {
    const first = vi.fn();
    const second = vi.fn();
    attach(first);
    attach(second);

    notificationEventBus.publish(EVENT);

    expect(first).toHaveBeenCalledWith(EVENT);
    expect(second).toHaveBeenCalledWith(EVENT);
  });

  it("stops delivering to a listener after offNotification", () => {
    const listener = vi.fn();
    attach(listener);
    notificationEventBus.offNotification(listener);

    notificationEventBus.publish(EVENT);

    expect(listener).not.toHaveBeenCalled();
  });

  it("supports far more listeners than Node's default warning threshold", () => {
    expect(notificationEventBus.getMaxListeners()).toBeGreaterThanOrEqual(1000);
  });
});
