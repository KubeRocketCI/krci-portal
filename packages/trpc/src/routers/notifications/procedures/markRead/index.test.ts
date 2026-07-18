import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../index.js";

describe("notifications.markRead", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("marks the given ids read for the session user's sub", async () => {
    const caller = createCaller(mockContext);
    const result = await caller.notifications.markRead({ ids: ["evt-1", "evt-2"] });

    expect(result).toEqual({ success: true });
    expect(mockContext.notificationsStore.markRead).toHaveBeenCalledWith({
      userSub: mockContext.session.user!.data!.sub,
      ids: ["evt-1", "evt-2"],
    });
  });

  it("rejects an empty ids array without touching the store", async () => {
    const caller = createCaller(mockContext);

    await expect(caller.notifications.markRead({ ids: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockContext.notificationsStore.markRead).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated caller with UNAUTHORIZED, never calling the store", async () => {
    mockContext.session.user = undefined;

    const caller = createCaller(mockContext);

    await expect(caller.notifications.markRead({ ids: ["evt-1"] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mockContext.notificationsStore.markRead).not.toHaveBeenCalled();
  });
});
