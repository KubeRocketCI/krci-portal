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

const { mockAuthenticateSA } = vi.hoisted(() => ({ mockAuthenticateSA: vi.fn() }));
vi.mock("../../utils/authenticateServiceAccountToken/index.js", () => ({
  authenticateServiceAccountToken: mockAuthenticateSA,
}));

const MockedOIDCClient = OIDCClient as unknown as Mock;

const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const makeJwt = (payload: object) => `${b64url({ alg: "none", typ: "JWT" })}.${b64url(payload)}.sig`;

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

    MockedOIDCClient.mockImplementation(function () {
      return {
        discover: vi.fn(),
        discoverOrThrow: mockDiscoverOrThrow,
        validateTokenAndGetUserInfo: mockValidateTokenAndGetUserInfo,
        validateTokenAndGetTokenInfo: mockValidateTokenAndGetTokenInfo,
        getNewTokens: vi.fn(),
      };
    });

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

  // Issuer-routed Bearer authentication: an SA token (or any token when OIDC is
  // unconfigured) is validated against the cluster via SelfSubjectReview, so the
  // CLI can present an SA token in the Authorization header in any configuration.
  describe("issuer-routed Bearer authentication (Service Account tokens)", () => {
    const saResult = {
      data: {
        sub: "sa-uid",
        name: "edp-admin",
        preferred_username: "system:serviceaccount:edp:edp-admin",
        email: "",
        groups: ["system:authenticated"],
        default_namespace: "edp",
      },
      secret: {
        idToken: "sa-token",
        idTokenExpiresAt: 1800000000000,
        accessToken: "sa-token",
        accessTokenExpiresAt: 1800000000000,
        refreshToken: "",
      },
    };

    beforeEach(() => {
      mockContext.session.user = undefined;
      mockAuthenticateSA.mockResolvedValue(saResult);
    });

    it("routes to the SA path when OIDC is not configured", async () => {
      mockContext.oidcConfig.issuerURL = "";
      setBearerHeader("any-sa-token");

      const caller = createTestRouterCaller(mockContext);
      const result = await caller.testProtected();

      expect(result).toBe(true);
      expect(mockAuthenticateSA).toHaveBeenCalledWith("any-sa-token");
      expect(mockDiscoverOrThrow).not.toHaveBeenCalled();
      expect(mockContext.session.user).toEqual(saResult);
    });

    it("routes to the SA path when the token issuer differs from the OIDC issuer", async () => {
      mockContext.oidcConfig.issuerURL = "https://oidc.example.com";
      const saToken = makeJwt({ iss: "https://kubernetes.default.svc" });
      setBearerHeader(saToken);

      const caller = createTestRouterCaller(mockContext);
      const result = await caller.testProtected();

      expect(result).toBe(true);
      expect(mockAuthenticateSA).toHaveBeenCalledWith(saToken);
      expect(mockValidateTokenAndGetUserInfo).not.toHaveBeenCalled();
    });

    it("routes to the OIDC path when the token issuer matches the OIDC issuer", async () => {
      mockContext.oidcConfig.issuerURL = "https://oidc.example.com";
      const oidcToken = makeJwt({ iss: "https://oidc.example.com" });
      setBearerHeader(oidcToken);

      const caller = createTestRouterCaller(mockContext);
      const result = await caller.testProtected();

      expect(result).toBe(true);
      expect(mockValidateTokenAndGetUserInfo).toHaveBeenCalled();
      expect(mockAuthenticateSA).not.toHaveBeenCalled();
    });
  });
});
