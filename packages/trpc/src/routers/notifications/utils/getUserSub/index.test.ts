import { beforeEach, describe, expect, it } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import type { TRPCContext } from "../../../../context/types.js";
import { getUserSub } from "./index.js";

describe("getUserSub", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  it("returns the session user's sub", () => {
    expect(getUserSub(mockContext as unknown as TRPCContext)).toBe(mockContext.session.user!.data!.sub);
  });

  it("throws UNAUTHORIZED when the session has no user", () => {
    mockContext.session.user = undefined;

    expect(() => getUserSub(mockContext as unknown as TRPCContext)).toThrowError(
      expect.objectContaining({ code: "UNAUTHORIZED" })
    );
  });

  it("throws UNAUTHORIZED when sub is missing from the user data", () => {
    mockContext.session.user!.data!.sub = "";

    expect(() => getUserSub(mockContext as unknown as TRPCContext)).toThrowError(
      expect.objectContaining({ code: "UNAUTHORIZED" })
    );
  });
});
