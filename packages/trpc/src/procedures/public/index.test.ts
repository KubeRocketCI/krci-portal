import { createMockedContext } from "../../__mocks__/context";
import { createTestRouterCaller } from "../../__mocks__/router";
import { ERROR_NO_SESSION_FOUND } from "../../routers/auth/errors";
import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("public procedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    // Create mock context
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return true", async () => {
    const caller = createTestRouterCaller(mockContext);
    const result = await caller.testPublic();
    expect(result).toBe(true);
  });

  it("should not throw an error if session user is not found", async () => {
    mockContext.session.user = undefined;

    const caller = createTestRouterCaller(mockContext);

    await expect(caller.testPublic()).not.toThrow(new TRPCError(ERROR_NO_SESSION_FOUND));
  });
});
