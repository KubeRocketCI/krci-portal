import { createMockedContext } from "../../__mocks__/context.js";
import { createTestRouterCaller } from "../../__mocks__/router.js";
import { ERROR_NO_SESSION_FOUND } from "../../routers/auth/errors/index.js";
import { resetBearerCache } from "./index.js";
import { OIDCClient } from "../../clients/oidc/index.js";
import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../../clients/oidc/index.js", () => ({
  OIDCClient: vi.fn(),
}));

const MockedOIDCClient = OIDCClient as unknown as Mock;

describe("protected procedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockDiscoverOrThrow: Mock;
  let mockValidateTokenAndGetUserInfo: Mock;
  let mockValidateTokenAndGetTokenInfo: Mock;

  const mockUserInfo = {
    sub: "bearer-user-123",
    email: "bearer@example.com",
    name: "Bearer User",
    preferred_username: "beareruser",
    email_verified: true,
    groups: ["group-1"],
    given_name: "Bearer",
    family_name: "User",
  };

  const mockTokenInfo = {
    idToken: "bearer-id-token",
    idTokenExpiresAt: 1800000000000,
    accessToken: "bearer-access-token",
    accessTokenExpiresAt: 1800000000000,
    refreshToken: "",
  };

  function setBearerHeader(token: string): void {
    mockContext.req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as typeof mockContext.req;
  }

  beforeEach(() => {
    mockDiscoverOrThrow = vi.fn().mockResolvedValue({});
    mockValidateTokenAndGetUserInfo = vi.fn().mockResolvedValue(mockUserInfo);
    mockValidateTokenAndGetTokenInfo = vi.fn().mockReturnValue(mockTokenInfo);

    MockedOIDCClient.mockImplementation(() => ({
      discover: vi.fn(),
      discoverOrThrow: mockDiscoverOrThrow,
      validateTokenAndGetUserInfo: mockValidateTokenAndGetUserInfo,
      validateTokenAndGetTokenInfo: mockValidateTokenAndGetTokenInfo,
      getNewTokens: vi.fn(),
    }));

    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
    resetBearerCache();
  });

  // Existing tests — cookie session path

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

  // Bearer token tests

  describe("Bearer token authentication", () => {
    beforeEach(() => {
      mockContext.session.user = undefined;
    });

    it("should authenticate successfully with a valid Bearer token", async () => {
      setBearerHeader("valid-jwt-token");

      const caller = createTestRouterCaller(mockContext);
      const result = await caller.testProtected();

      expect(result).toBe(true);
      expect(mockDiscoverOrThrow).toHaveBeenCalled();
      expect(mockValidateTokenAndGetUserInfo).toHaveBeenCalled();
      expect(mockValidateTokenAndGetTokenInfo).toHaveBeenCalledWith("valid-jwt-token");
      expect(mockContext.session.user).toEqual({
        data: mockUserInfo,
        secret: mockTokenInfo,
      });
    });

    it("should throw UNAUTHORIZED when Bearer token validation fails", async () => {
      setBearerHeader("invalid-token");

      mockValidateTokenAndGetUserInfo.mockRejectedValueOnce(
        new TRPCError({ code: "UNAUTHORIZED", message: "JWT verification failed: signature verification failed" })
      );

      const caller = createTestRouterCaller(mockContext);

      await expect(caller.testProtected()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("should throw UNAUTHORIZED when Bearer token is expired", async () => {
      setBearerHeader("expired-token");

      mockValidateTokenAndGetUserInfo.mockRejectedValueOnce(
        new TRPCError({ code: "UNAUTHORIZED", message: "Token validation failed: Token is invalid or expired" })
      );

      const caller = createTestRouterCaller(mockContext);

      await expect(caller.testProtected()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("should throw UNAUTHORIZED when Authorization header is malformed", async () => {
      mockContext.req = {
        headers: { authorization: "Basic dXNlcjpwYXNz" },
      } as unknown as typeof mockContext.req;

      const caller = createTestRouterCaller(mockContext);

      await expect(caller.testProtected()).rejects.toThrow(new TRPCError(ERROR_NO_SESSION_FOUND));
    });

    it("should prefer cookie session over Bearer token when both are present", async () => {
      mockContext.session.user = {
        data: {
          sub: "cookie-user",
          email: "cookie@example.com",
          name: "Cookie User",
          preferred_username: "cookieuser",
          email_verified: true,
          groups: ["group-1"],
          given_name: "Cookie",
          family_name: "User",
        },
        secret: {
          idToken: "cookie-id-token",
          idTokenExpiresAt: 1800000000000,
          accessToken: "cookie-access-token",
          accessTokenExpiresAt: 1800000000000,
          refreshToken: "cookie-refresh-token",
        },
      };
      setBearerHeader("should-not-be-used");

      const caller = createTestRouterCaller(mockContext);
      const result = await caller.testProtected();

      expect(result).toBe(true);
      expect(mockDiscoverOrThrow).not.toHaveBeenCalled();
      expect(mockValidateTokenAndGetUserInfo).not.toHaveBeenCalled();
      expect(mockValidateTokenAndGetTokenInfo).not.toHaveBeenCalled();
    });

    it("should throw error when OIDC discovery fails", async () => {
      setBearerHeader("valid-token");

      mockDiscoverOrThrow.mockRejectedValueOnce(
        new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to connect to the identity provider." })
      );

      const caller = createTestRouterCaller(mockContext);

      await expect(caller.testProtected()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to connect to the identity provider.",
      });
    });

    it("should throw UNAUTHORIZED when Bearer token is empty", async () => {
      setBearerHeader("");

      const caller = createTestRouterCaller(mockContext);

      await expect(caller.testProtected()).rejects.toThrow(new TRPCError(ERROR_NO_SESSION_FOUND));
    });

    it("should not set session.user when Bearer token is rejected (security regression)", async () => {
      setBearerHeader("forged-token");

      mockValidateTokenAndGetUserInfo.mockRejectedValueOnce(
        new TRPCError({ code: "UNAUTHORIZED", message: "JWT verification failed: signature verification failed" })
      );

      const caller = createTestRouterCaller(mockContext);

      await expect(caller.testProtected()).rejects.toThrow();
      expect(mockContext.session.user).toBeUndefined();
    });
  });
});
