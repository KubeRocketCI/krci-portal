import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockDiscover = vi.fn();
const mockExchangeCodeForTokens = vi.fn();
const mockNormalizeTokenResponse = vi.fn();
const mockFetchUserInfo = vi.fn();

vi.mock("../../../../clients/oidc/index.js", () => ({
  OIDCClient: vi.fn().mockImplementation(() => ({
    discoverOrThrow: mockDiscover,
    exchangeCodeForTokens: mockExchangeCodeForTokens,
    normalizeTokenResponse: mockNormalizeTokenResponse,
    fetchUserInfoOrThrow: mockFetchUserInfo,
  })),
}));

describe("authLoginCallbackProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  const mockUserInfo = {
    sub: "user-123",
    email: "user@example.com",
    name: "Test User",
    preferred_username: "testuser",
    email_verified: true,
    groups: ["group-1"],
    given_name: "Test",
    family_name: "User",
  };

  const mockNormalizedTokens = {
    idToken: "id-token",
    idTokenExpiresAt: 1234567890,
    accessToken: "access-token",
    accessTokenExpiresAt: 1234567890,
    refreshToken: "refresh-token",
  };

  // portalUrl in mock context is "http://localhost:8000"
  const VALID_CALLBACK_URL = "http://localhost:8000/auth/callback?code=abc123&state=random-state";

  beforeEach(() => {
    mockContext = createMockedContext();
    mockContext.session.login = {
      openId: {
        state: "random-state",
        codeVerifier: "verifier123",
      },
      clientSearch: "?redirect=/pipelines",
    };
    mockDiscover.mockResolvedValue({});
    mockExchangeCodeForTokens.mockResolvedValue({ access_token: "access-token" });
    mockNormalizeTokenResponse.mockReturnValue(mockNormalizedTokens);
    mockFetchUserInfo.mockResolvedValue(mockUserInfo);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should process callback and return user info", async () => {
    const caller = createCaller(mockContext);

    const result = await caller.auth.loginCallback(VALID_CALLBACK_URL);

    expect(result.success).toBe(true);
    expect(result.userInfo).toEqual(
      expect.objectContaining({
        ...mockUserInfo,
        issuerUrl: mockContext.oidcConfig.issuerURL,
      })
    );
    expect(result.clientSearch).toBe("?redirect=/pipelines");
    expect(mockContext.session.user).toEqual({
      data: mockUserInfo,
      secret: mockNormalizedTokens,
    });
    expect(mockContext.session.login).toBeUndefined();
    expect(mockExchangeCodeForTokens).toHaveBeenCalled();
    expect(mockFetchUserInfo).toHaveBeenCalled();
  });

  it("should reject callback URL with wrong origin", async () => {
    const caller = createCaller(mockContext);
    const input = "https://evil.com/auth/callback?code=abc123&state=random-state";

    await expect(caller.auth.loginCallback(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Invalid callback URL origin",
    });
    expect(mockExchangeCodeForTokens).not.toHaveBeenCalled();
  });

  it("should throw when session.login is undefined", async () => {
    mockContext.session.login = undefined;
    const caller = createCaller(mockContext);

    await expect(caller.auth.loginCallback(VALID_CALLBACK_URL)).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "No pending login session",
    });
    expect(mockExchangeCodeForTokens).not.toHaveBeenCalled();
  });

  it("should throw when state is invalid", async () => {
    const caller = createCaller(mockContext);
    const input = "http://localhost:8000/auth/callback?code=abc123&state=wrong-state";

    await expect(caller.auth.loginCallback(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Invalid or mismatched state parameter",
    });
    expect(mockExchangeCodeForTokens).not.toHaveBeenCalled();
  });

  it("should throw when stored state or codeVerifier is missing", async () => {
    mockContext.session.login = {
      openId: { state: "random-state", codeVerifier: "" },
      clientSearch: "",
    };
    const caller = createCaller(mockContext);
    const input = "http://localhost:8000/auth/callback?code=abc123&state=random-state";

    await expect(caller.auth.loginCallback(input)).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Invalid or mismatched state parameter",
    });
  });

  it("should clear session login state even when token exchange fails", async () => {
    mockExchangeCodeForTokens.mockRejectedValueOnce(new Error("token exchange failed"));
    const caller = createCaller(mockContext);

    await expect(caller.auth.loginCallback(VALID_CALLBACK_URL)).rejects.toThrow();

    // Login state should be cleared (single-use) even on failure
    expect(mockContext.session.login).toBeUndefined();
  });

  it("should propagate discoverOrThrow() errors", async () => {
    mockDiscover.mockRejectedValueOnce(
      new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to connect to the identity provider." })
    );
    const caller = createCaller(mockContext);

    await expect(caller.auth.loginCallback(VALID_CALLBACK_URL)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to connect to the identity provider.",
    });
  });
});
