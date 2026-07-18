import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../index.js";

describe("notifications.markAllRead", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("marks everything read for the session user's sub only", async () => {
    const caller = createCaller(mockContext);
    const result = await caller.notifications.markAllRead();

    expect(result).toEqual({ success: true });
    expect(mockContext.notificationsStore.markAllRead).toHaveBeenCalledWith({
      userSub: mockContext.session.user!.data!.sub,
    });
  });

  it("rejects an unauthenticated caller with UNAUTHORIZED, never calling the store", async () => {
    mockContext.session.user = undefined;

    const caller = createCaller(mockContext);

    await expect(caller.notifications.markAllRead()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mockContext.notificationsStore.markAllRead).not.toHaveBeenCalled();
  });
});
