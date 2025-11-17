import { createMockedContext } from "../../__mocks__/context.js";
import { createTestRouterCaller } from "../../__mocks__/router.js";
import { ERROR_NO_SESSION_FOUND } from "../../routers/auth/errors/index.js";
import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("protected procedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    // Create mock context
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return true if session user is found", async () => {
    const caller = createTestRouterCaller(mockContext);
    const result = await caller.testProtected();
    expect(result).toBe(true);
  });

  it("should throw an error if session user is not found", async () => {
    mockContext.session.user = undefined;

    const caller = createTestRouterCaller(mockContext);

    await expect(caller.testProtected()).rejects.toThrow(new TRPCError(ERROR_NO_SESSION_FOUND));
  });
});
