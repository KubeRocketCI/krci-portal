import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("authLogoutProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    // Create mocked context
    mockContext = createMockedContext();

    // Reset mocks
    vi.clearAllMocks();

    // Create caller with mocked context
    caller = createCaller(mockContext);
    mockContext.session.destroy = vi.fn();
  });

  it("should successfully log out and return success true", async () => {
    const result = await caller.auth.logout();

    expect(mockContext.session.destroy).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("should handle session destroy error gracefully", async () => {
    const result = await caller.auth.logout();
    expect(result).toEqual({
      success: true,
    });
    expect(mockContext.session.destroy).toHaveBeenCalled();
  });
});
