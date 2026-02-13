import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockDiscover = vi.fn();
const mockValidateTokenAndGetUserInfo = vi.fn();
const mockValidateTokenAndGetTokenInfo = vi.fn();

vi.mock("../../../../clients/oidc/index.js", () => ({
  OIDCClient: vi.fn().mockImplementation(() => ({
    discover: mockDiscover,
    validateTokenAndGetUserInfo: mockValidateTokenAndGetUserInfo,
    validateTokenAndGetTokenInfo: mockValidateTokenAndGetTokenInfo,
  })),
}));

describe("authLoginWithTokenProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  const mockUserInfo = {
    sub: "user-456",
    email: "tokenuser@example.com",
    name: "Token User",
    preferred_username: "tokenuser",
    email_verified: true,
    groups: ["group-2"],
    given_name: "Token",
    family_name: "User",
  };

  const mockTokenInfo = {
    idToken: "id-token",
    idTokenExpiresAt: 1234567890,
    accessToken: "access-token",
    accessTokenExpiresAt: 1234567890,
    refreshToken: "refresh-token",
  };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockDiscover.mockResolvedValue({});
    mockValidateTokenAndGetUserInfo.mockResolvedValue(mockUserInfo);
    mockValidateTokenAndGetTokenInfo.mockReturnValue(mockTokenInfo);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should validate token and return user info", async () => {
    const caller = createCaller(mockContext);
    const result = await caller.auth.loginWithToken({ token: "valid-jwt-token" });

    expect(result.success).toBe(true);
    expect(result.userInfo).toEqual(
      expect.objectContaining({
        ...mockUserInfo,
        issuerUrl: mockContext.oidcConfig.issuerURL,
      })
    );
    expect(result.clientSearch).toBe("");
    expect(mockContext.session.user).toEqual({
      data: mockUserInfo,
      secret: mockTokenInfo,
    });
    expect(mockValidateTokenAndGetUserInfo).toHaveBeenCalled();
    expect(mockValidateTokenAndGetTokenInfo).toHaveBeenCalledWith("valid-jwt-token");
  });

  it("should include redirect in clientSearch when redirectSearchParam provided", async () => {
    const caller = createCaller(mockContext);
    const result = await caller.auth.loginWithToken({
      token: "valid-jwt-token",
      redirectSearchParam: "/pipelines",
    });

    expect(result.clientSearch).toBe("?redirect=/pipelines");
  });

  it("should throw UNAUTHORIZED when token validation fails", async () => {
    mockValidateTokenAndGetUserInfo.mockRejectedValueOnce(new Error("Invalid token"));
    const caller = createCaller(mockContext);

    await expect(caller.auth.loginWithToken({ token: "invalid-token" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: expect.stringContaining("Token validation failed"),
    });
  });
});
