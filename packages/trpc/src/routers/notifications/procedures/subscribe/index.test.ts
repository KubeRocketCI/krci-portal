import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationEvent } from "@my-project/shared";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../index.js";
import { notificationEventBus } from "../../../../clients/eventBus/index.js";

function buildEvent(id: string): NotificationEvent {
  return {
    id,
    type: "pipelinerun.failed",
    severity: "error",
    title: "Build pipeline failed",
    body: "PipelineRun failed in namespace krci",
    namespace: "krci",
    timestamp: "2026-07-18T10:00:00Z",
  };
}

describe("notifications.subscribe", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("yields events published on the bus and detaches its listener on generator return", async () => {
    const caller = createCaller(mockContext);
    const iterable = await caller.notifications.subscribe();
    const generator = iterable[Symbol.asyncIterator]();

    const listenersBefore = notificationEventBus.listenerCount("notification");

    const firstEvent = generator.next();
    // The listener registers on the generator's first pump, not on creation.
    await Promise.resolve();
    expect(notificationEventBus.listenerCount("notification")).toBe(listenersBefore + 1);

    notificationEventBus.publish(buildEvent("evt-1"));

    await expect(firstEvent).resolves.toMatchObject({ done: false, value: { id: "evt-1" } });

    await generator.return?.(undefined);

    expect(notificationEventBus.listenerCount("notification")).toBe(listenersBefore);
  });

  it("rejects an unauthenticated caller with UNAUTHORIZED without registering a listener", async () => {
    mockContext.session.user = undefined;
    const listenersBefore = notificationEventBus.listenerCount("notification");

    const caller = createCaller(mockContext);

    await expect(caller.notifications.subscribe()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(notificationEventBus.listenerCount("notification")).toBe(listenersBefore);
  });
});
