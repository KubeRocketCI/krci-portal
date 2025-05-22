import { createMockedContext } from "@/__mocks__/context";
import { mockSession } from "@/__mocks__/session";
import { createCaller } from "@/trpc/routers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ERROR_NO_SESSION_FOUND } from "../../errors";
import { TRPCError } from "@trpc/server";

describe("authMeProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    // Create mocked context
    mockContext = createMockedContext();

    // Reset mocks
    vi.clearAllMocks();

    // Create caller with mocked context
    caller = createCaller(mockContext);
  });

  it("should successfully return user data", async () => {
    const result = await caller.auth.me();

    expect(result).toEqual(mockSession.user.data);
  });

  it("should throw error if session is not found", async () => {
    mockContext.session.user = undefined;
    await expect(caller.auth.me()).rejects.toThrow(
      new TRPCError(ERROR_NO_SESSION_FOUND)
    );
  });
});
