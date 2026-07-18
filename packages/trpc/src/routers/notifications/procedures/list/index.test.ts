import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../index.js";

describe("notifications.list", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("scopes the store query to the session user's sub and forwards the limit", async () => {
    const items = [{ id: "evt-1", read: false }];
    vi.mocked(mockContext.notificationsStore.list).mockReturnValue(
      items as ReturnType<typeof mockContext.notificationsStore.list>
    );

    const caller = createCaller(mockContext);
    const result = await caller.notifications.list({ limit: 5 });

    expect(result).toEqual(items);
    expect(mockContext.notificationsStore.list).toHaveBeenCalledWith({
      userSub: mockContext.session.user!.data!.sub,
      limit: 5,
    });
  });

  it("rejects a limit above 100 without touching the store", async () => {
    const caller = createCaller(mockContext);

    await expect(caller.notifications.list({ limit: 101 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockContext.notificationsStore.list).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated caller with UNAUTHORIZED, never calling the store", async () => {
    mockContext.session.user = undefined;

    const caller = createCaller(mockContext);

    await expect(caller.notifications.list({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mockContext.notificationsStore.list).not.toHaveBeenCalled();
  });
});
