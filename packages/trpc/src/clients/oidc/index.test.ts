import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { OIDCClient } from "./index.js";
import type { Configuration } from "openid-client";

// Mock jose
const mockJwtVerify = vi.fn();
const mockCreateRemoteJWKSet = vi.fn((..._args: any[]) => "mock-jwks-function");
const { errors: joseErrors } = await vi.importActual<typeof import("jose")>("jose");
vi.mock("jose", async () => {
  const actual = await vi.importActual<typeof import("jose")>("jose");
  return {
    ...actual,
    jwtVerify: (...args: any[]) => mockJwtVerify(...args),
    createRemoteJWKSet: (...args: any[]) => mockCreateRemoteJWKSet(...args),
  };
});

// Mock openid-client (fetchProtectedResource, authorizationCodeGrant, refreshTokenGrant)
const mockFetchProtectedResource = vi.fn();
const mockAuthorizationCodeGrant = vi.fn();
const mockRefreshTokenGrant = vi.fn();
vi.mock("openid-client", async () => {
  const actual = await vi.importActual("openid-client");
  return {
    ...actual,
    fetchProtectedResource: (...args: any[]) => mockFetchProtectedResource(...args),
    authorizationCodeGrant: (...args: any[]) => mockAuthorizationCodeGrant(...args),
    refreshTokenGrant: (...args: any[]) => mockRefreshTokenGrant(...args),
  };
});

const validConfig = {
  issuerURL: "https://idp.example.com",
  clientID: "my-client-id",
  clientSecret: "my-client-secret",
  scope: "openid profile email",
  codeChallengeMethod: "S256",
};

const mockUserInfo = {
  sub: "user-123",
  email: "user@example.com",
  name: "Test User",
};

function createMockOIDCConfig(overrides?: {
  jwks_uri?: string;
  issuer?: string;
  userinfo_endpoint?: string;
}): Configuration {
  const defaults = {
    issuer: "https://idp.example.com",
    jwks_uri: "https://idp.example.com/.well-known/jwks.json",
    userinfo_endpoint: "https://idp.example.com/userinfo",
  };
  const merged = { ...defaults, ...overrides };
  return {
    serverMetadata: () => merged,
  } as unknown as Configuration;
}

const FAKE_JWT = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature";
const OPAQUE_TOKEN = "opaque-access-token-no-dots";

function mockResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)) };
}

describe("OIDCClient", () => {
  let client: OIDCClient;

  beforeEach(() => {
    client = new OIDCClient(validConfig);
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with valid config", () => {
      expect(client).toBeInstanceOf(OIDCClient);
    });

    it("should throw TRPCError if issuerURL is missing", () => {
      expect(() => new OIDCClient({ ...validConfig, issuerURL: "" })).toThrow(TRPCError);
    });

    it("should throw TRPCError if clientID is missing", () => {
      expect(() => new OIDCClient({ ...validConfig, clientID: "" })).toThrow(TRPCError);
    });

    it("should throw TRPCError if clientSecret is missing", () => {
      expect(() => new OIDCClient({ ...validConfig, clientSecret: "" })).toThrow(TRPCError);
    });
  });

  describe("validateTokenAndGetUserInfo", () => {
    it("should return verified claims when JWT has valid signature and sufficient claims", async () => {
      const oidcConfig = createMockOIDCConfig();
      mockJwtVerify.mockResolvedValue({ payload: mockUserInfo });

      const result = await client.validateTokenAndGetUserInfo(oidcConfig, FAKE_JWT);

      expect(mockJwtVerify).toHaveBeenCalledWith(FAKE_JWT, "mock-jwks-function", {
        issuer: "https://idp.example.com",
        audience: "my-client-id",
        clockTolerance: 30,
        algorithms: ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "PS256", "PS384", "PS512"],
      });
      expect(result).toEqual(mockUserInfo);
    });

    it("should fall back to userinfo when JWT is valid but claims are insufficient", async () => {
      const oidcConfig = createMockOIDCConfig();
      mockJwtVerify.mockResolvedValue({ payload: { sub: "user-123" } });
      mockFetchProtectedResource.mockResolvedValue(mockResponse(mockUserInfo));

      const result = await client.validateTokenAndGetUserInfo(oidcConfig, FAKE_JWT);

      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockFetchProtectedResource).toHaveBeenCalled();
      expect(result).toEqual(mockUserInfo);
    });

    it("should hard-reject forged JWT (invalid signature) without falling back to userinfo", async () => {
      const oidcConfig = createMockOIDCConfig();
      mockJwtVerify.mockRejectedValue(new joseErrors.JWSSignatureVerificationFailed());

      await expect(client.validateTokenAndGetUserInfo(oidcConfig, FAKE_JWT)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: expect.stringContaining("JWT verification failed"),
      });
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockFetchProtectedResource).not.toHaveBeenCalled();
    });

    it("should hard-reject expired JWT without falling back to userinfo", async () => {
      const oidcConfig = createMockOIDCConfig();
      mockJwtVerify.mockRejectedValue(new joseErrors.JWTExpired("token expired", { exp: 0 }, "exp"));

      await expect(client.validateTokenAndGetUserInfo(oidcConfig, FAKE_JWT)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: expect.stringContaining("JWT verification failed"),
      });
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockFetchProtectedResource).not.toHaveBeenCalled();
    });

    it("should use userinfo for opaque (non-JWT) tokens", async () => {
      const oidcConfig = createMockOIDCConfig();
      mockFetchProtectedResource.mockResolvedValue(mockResponse(mockUserInfo));

      const result = await client.validateTokenAndGetUserInfo(oidcConfig, OPAQUE_TOKEN);

      expect(mockJwtVerify).not.toHaveBeenCalled();
      expect(mockFetchProtectedResource).toHaveBeenCalled();
      expect(result).toEqual(mockUserInfo);
    });

    it("should use userinfo when metadata has no jwks_uri", async () => {
      const oidcConfig = createMockOIDCConfig({ jwks_uri: undefined });
      mockFetchProtectedResource.mockResolvedValue(mockResponse(mockUserInfo));

      const result = await client.validateTokenAndGetUserInfo(oidcConfig, FAKE_JWT);

      expect(mockJwtVerify).not.toHaveBeenCalled();
      expect(mockFetchProtectedResource).toHaveBeenCalled();
      expect(result).toEqual(mockUserInfo);
    });

    it("should fall back to userinfo when JWT has wrong audience", async () => {
      const oidcConfig = createMockOIDCConfig();
      mockJwtVerify.mockRejectedValue(
        new joseErrors.JWTClaimValidationFailed('"aud" claim mismatch', {}, "aud", "check_failed")
      );
      mockFetchProtectedResource.mockResolvedValue(mockResponse(mockUserInfo));

      const result = await client.validateTokenAndGetUserInfo(oidcConfig, FAKE_JWT);

      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockFetchProtectedResource).toHaveBeenCalled();
      expect(result).toEqual(mockUserInfo);
    });

    it("should hard-reject JWT with wrong issuer without falling back to userinfo", async () => {
      const oidcConfig = createMockOIDCConfig();
      mockJwtVerify.mockRejectedValue(
        new joseErrors.JWTClaimValidationFailed('"iss" claim mismatch', {}, "iss", "check_failed")
      );

      await expect(client.validateTokenAndGetUserInfo(oidcConfig, FAKE_JWT)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: expect.stringContaining("JWT verification failed"),
      });
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockFetchProtectedResource).not.toHaveBeenCalled();
    });

    it("should hard-reject when jwtVerify throws a non-JOSE error (e.g., network failure)", async () => {
      const oidcConfig = createMockOIDCConfig();
      mockJwtVerify.mockRejectedValue(new TypeError("fetch failed"));

      await expect(client.validateTokenAndGetUserInfo(oidcConfig, FAKE_JWT)).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to verify token signature. Please try again later.",
      });
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockFetchProtectedResource).not.toHaveBeenCalled();
    });

    it("should hard-reject JWT with alg:none (algorithm not allowed)", async () => {
      const oidcConfig = createMockOIDCConfig();
      mockJwtVerify.mockRejectedValue(
        new joseErrors.JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed')
      );

      await expect(client.validateTokenAndGetUserInfo(oidcConfig, FAKE_JWT)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: expect.stringContaining("JWT verification failed"),
      });
      expect(mockFetchProtectedResource).not.toHaveBeenCalled();
    });

    it("should normalize groups from verified JWT claims", async () => {
      const oidcConfig = createMockOIDCConfig();
      const userWithGroups = {
        ...mockUserInfo,
        groups: ['["admin","users"]'],
      };
      mockJwtVerify.mockResolvedValue({ payload: userWithGroups });

      const result = await client.validateTokenAndGetUserInfo(oidcConfig, FAKE_JWT);

      expect(result.groups).toEqual(["admin", "users"]);
    });

    it("should cache JWKS per issuer", async () => {
      const oidcConfig = createMockOIDCConfig();
      mockJwtVerify.mockResolvedValue({ payload: mockUserInfo });

      await client.validateTokenAndGetUserInfo(oidcConfig, FAKE_JWT);
      await client.validateTokenAndGetUserInfo(oidcConfig, FAKE_JWT);

      // createRemoteJWKSet should only be called once (cached)
      expect(mockCreateRemoteJWKSet).toHaveBeenCalledTimes(1);
    });
  });

  describe("validateTokenAndGetTokenInfo", () => {
    it("should extract exp from JWT", () => {
      const payload = { exp: 1700000000 };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
      const token = `eyJhbGciOiJSUzI1NiJ9.${encodedPayload}.signature`;

      const result = client.validateTokenAndGetTokenInfo(token);

      expect(result.idToken).toBe(token);
      expect(result.accessToken).toBe(token);
      expect(result.idTokenExpiresAt).toBe(1700000000000);
      expect(result.accessTokenExpiresAt).toBe(1700000000000);
      expect(result.refreshToken).toBe("");
    });

    it("should use 5-minute default for opaque tokens", () => {
      const now = Date.now();
      const result = client.validateTokenAndGetTokenInfo(OPAQUE_TOKEN);

      const fiveMinutes = 5 * 60 * 1000;
      expect(result.idTokenExpiresAt).toBeGreaterThanOrEqual(now + fiveMinutes - 1000);
      expect(result.idTokenExpiresAt).toBeLessThanOrEqual(now + fiveMinutes + 1000);
    });
  });

  describe("normalizeTokenResponse", () => {
    const FAKE_ID_JWT = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTcwMDAwMDAwMH0.signature";
    const FAKE_ACCESS_JWT = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTcwMDAwMDAwMH0.access-sig";

    it("should use id_token when present (Azure AD with openid scope)", () => {
      const result = client.normalizeTokenResponse({
        access_token: OPAQUE_TOKEN,
        token_type: "bearer",
        id_token: FAKE_ID_JWT,
        expires_in: 3600,
      } as any);

      expect(result.idToken).toBe(FAKE_ID_JWT);
      expect(result.accessToken).toBe(OPAQUE_TOKEN);
      expect(result.idToken).not.toBe(result.accessToken);
    });

    it("should throw when id_token is missing for openid flow (OIDC Core §3.1.3.3)", () => {
      expect(() =>
        client.normalizeTokenResponse({
          access_token: FAKE_ACCESS_JWT,
          token_type: "bearer",
          expires_in: 3600,
        } as any)
      ).toThrow(TRPCError);
    });

    it("should fall back to access_token when no id_token for non-openid flow", () => {
      const nonOpenidClient = new OIDCClient({ ...validConfig, scope: "profile email" });
      const result = nonOpenidClient.normalizeTokenResponse({
        access_token: FAKE_ACCESS_JWT,
        token_type: "bearer",
        expires_in: 3600,
      } as any);

      expect(result.idToken).toBe(FAKE_ACCESS_JWT);
      expect(result.accessToken).toBe(FAKE_ACCESS_JWT);
    });

    it("should throw when access_token is missing", () => {
      expect(() =>
        client.normalizeTokenResponse({
          access_token: "",
          token_type: "bearer",
        } as any)
      ).toThrow(TRPCError);
    });

    it("should extract refresh_token", () => {
      const result = client.normalizeTokenResponse({
        access_token: FAKE_ACCESS_JWT,
        token_type: "bearer",
        id_token: FAKE_ID_JWT,
        refresh_token: "refresh-123",
        expires_in: 3600,
      } as any);

      expect(result.refreshToken).toBe("refresh-123");
    });

    it("should default refresh_token to empty string", () => {
      const result = client.normalizeTokenResponse({
        access_token: FAKE_ACCESS_JWT,
        token_type: "bearer",
        id_token: FAKE_ID_JWT,
        expires_in: 3600,
      } as any);

      expect(result.refreshToken).toBe("");
    });
  });

  describe("getNewTokens", () => {
    const oidcConfig = createMockOIDCConfig();

    function makeJwtWithExp(expSeconds: number, sub = "user-123"): string {
      const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64url");
      const payload = Buffer.from(JSON.stringify({ sub, exp: expSeconds })).toString("base64url");
      return `${header}.${payload}.signature`;
    }

    function makeCurrentSecret(
      overrides?: Partial<{ idToken: string; idTokenExpiresAt: number; refreshToken: string }>
    ) {
      const futureExp = Math.floor(Date.now() / 1000) + 32400; // +9hrs
      return {
        idToken: makeJwtWithExp(futureExp),
        idTokenExpiresAt: futureExp * 1000,
        refreshToken: "refresh-token-123",
        ...overrides,
      };
    }

    it("should not pass scope to refreshTokenGrant (Azure AD v1.0 returns unsigned JWTs with scope)", async () => {
      const secret = makeCurrentSecret();
      const futureExp = Math.floor(Date.now() / 1000) + 3600;

      mockRefreshTokenGrant.mockResolvedValue({
        access_token: OPAQUE_TOKEN,
        token_type: "bearer",
        id_token: makeJwtWithExp(futureExp),
        expires_in: 3600,
      });

      await client.getNewTokens(oidcConfig, secret);

      expect(mockRefreshTokenGrant).toHaveBeenCalledWith(oidcConfig, secret.refreshToken);
    });

    it("should use new id_token when refresh response includes one (Keycloak)", async () => {
      const secret = makeCurrentSecret();
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const newIdToken = makeJwtWithExp(futureExp);

      mockRefreshTokenGrant.mockResolvedValue({
        access_token: OPAQUE_TOKEN,
        token_type: "bearer",
        id_token: newIdToken,
        expires_in: 3600,
      });

      const result = await client.getNewTokens(oidcConfig, secret);

      expect(result.idToken).toBe(newIdToken);
      expect(result.idTokenExpiresAt).toBe(futureExp * 1000);
      expect(result.accessToken).toBe(OPAQUE_TOKEN);
    });

    it("should preserve current id_token when refresh omits it — OIDC §12.2 (Azure AD)", async () => {
      const secret = makeCurrentSecret();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockRefreshTokenGrant.mockResolvedValue({
        access_token: OPAQUE_TOKEN,
        token_type: "bearer",
        expires_in: 3600,
      });

      const result = await client.getNewTokens(oidcConfig, secret);

      expect(result.idToken).toBe(secret.idToken);
      expect(result.idTokenExpiresAt).toBe(secret.idTokenExpiresAt);
      expect(result.accessToken).toBe(OPAQUE_TOKEN);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("OIDC §12.2"));
      warnSpy.mockRestore();
    });

    it("should throw UNAUTHORIZED when current id_token is expired and refresh omits id_token", async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const secret = makeCurrentSecret({ idToken: makeJwtWithExp(pastExp), idTokenExpiresAt: pastExp * 1000 });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockRefreshTokenGrant.mockResolvedValue({
        access_token: OPAQUE_TOKEN,
        token_type: "bearer",
        expires_in: 3600,
      });

      await expect(client.getNewTokens(oidcConfig, secret)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: "Session expired. Please log in again.",
      });

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Forcing re-login"));
      errorSpy.mockRestore();
    });

    it("should throw UNAUTHORIZED when current id_token is opaque and refresh omits id_token", async () => {
      const secret = makeCurrentSecret({ idToken: OPAQUE_TOKEN, idTokenExpiresAt: Date.now() + 3600000 });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockRefreshTokenGrant.mockResolvedValue({
        access_token: OPAQUE_TOKEN,
        token_type: "bearer",
        expires_in: 3600,
      });

      await expect(client.getNewTokens(oidcConfig, secret)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: "Session expired. Please log in again.",
      });

      errorSpy.mockRestore();
    });

    it("should preserve current refresh_token when response omits it (RFC 6749 §6)", async () => {
      const secret = makeCurrentSecret();

      mockRefreshTokenGrant.mockResolvedValue({
        access_token: OPAQUE_TOKEN,
        token_type: "bearer",
        id_token: secret.idToken,
        expires_in: 3600,
        // no refresh_token in response
      });

      const result = await client.getNewTokens(oidcConfig, secret);

      expect(result.refreshToken).toBe(secret.refreshToken);
    });

    it("should use rotated refresh_token when response includes one (RFC 6749 §6)", async () => {
      const secret = makeCurrentSecret();

      mockRefreshTokenGrant.mockResolvedValue({
        access_token: OPAQUE_TOKEN,
        token_type: "bearer",
        id_token: secret.idToken,
        expires_in: 3600,
        refresh_token: "rotated-refresh-token",
      });

      const result = await client.getNewTokens(oidcConfig, secret);

      expect(result.refreshToken).toBe("rotated-refresh-token");
    });

    it("should throw UNAUTHORIZED when refreshed id_token has different subject (OIDC §12.2)", async () => {
      const secret = makeCurrentSecret();
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const newIdToken = makeJwtWithExp(futureExp, "different-user");
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockRefreshTokenGrant.mockResolvedValue({
        access_token: OPAQUE_TOKEN,
        token_type: "bearer",
        id_token: newIdToken,
        expires_in: 3600,
      });

      await expect(client.getNewTokens(oidcConfig, secret)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: expect.stringContaining("Identity changed"),
      });

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("subject changed"));
      errorSpy.mockRestore();
    });

    it("should accept refreshed id_token when subject matches", async () => {
      const secret = makeCurrentSecret();
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const newIdToken = makeJwtWithExp(futureExp, "user-123");

      mockRefreshTokenGrant.mockResolvedValue({
        access_token: OPAQUE_TOKEN,
        token_type: "bearer",
        id_token: newIdToken,
        expires_in: 3600,
      });

      const result = await client.getNewTokens(oidcConfig, secret);

      expect(result.idToken).toBe(newIdToken);
    });

    it("should use actual JWT exp claim, not session-stored idTokenExpiresAt", async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 32400; // +9hrs in JWT
      const staleSessionExp = Date.now() + 60000; // session says 1 min left (stale)
      const secret = makeCurrentSecret({
        idToken: makeJwtWithExp(futureExp),
        idTokenExpiresAt: staleSessionExp,
      });
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockRefreshTokenGrant.mockResolvedValue({
        access_token: OPAQUE_TOKEN,
        token_type: "bearer",
        expires_in: 3600,
      });

      const result = await client.getNewTokens(oidcConfig, secret);

      expect(result.idTokenExpiresAt).toBe(futureExp * 1000);
      expect(result.idTokenExpiresAt).not.toBe(staleSessionExp);
      warnSpy.mockRestore();
    });

    it("should throw UNAUTHORIZED when refreshTokenGrant fails", async () => {
      const secret = makeCurrentSecret();
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockRefreshTokenGrant.mockRejectedValue(new Error("refresh failed"));

      await expect(client.getNewTokens(oidcConfig, secret)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        message: "Session expired. Please log in again.",
      });

      errorSpy.mockRestore();
    });
  });

  describe("exchangeCodeForTokens", () => {
    const oidcConfig = createMockOIDCConfig();

    it("should pass idTokenExpected: true when scope includes openid", async () => {
      const mockResponse = { access_token: "token", token_type: "bearer" };
      mockAuthorizationCodeGrant.mockResolvedValue(mockResponse);

      const url = new URL("http://localhost:8000/callback?code=abc");
      await client.exchangeCodeForTokens(oidcConfig, url, "verifier", "state");

      expect(mockAuthorizationCodeGrant).toHaveBeenCalledWith(
        oidcConfig,
        url,
        expect.objectContaining({ idTokenExpected: true })
      );
    });

    it("should not set idTokenExpected when scope lacks openid", async () => {
      const noOpenidClient = new OIDCClient({ ...validConfig, scope: "profile email" });
      const mockResponse = { access_token: "token", token_type: "bearer" };
      mockAuthorizationCodeGrant.mockResolvedValue(mockResponse);

      const url = new URL("http://localhost:8000/callback?code=abc");
      await noOpenidClient.exchangeCodeForTokens(oidcConfig, url, "verifier", "state");

      expect(mockAuthorizationCodeGrant).toHaveBeenCalledWith(
        oidcConfig,
        url,
        expect.objectContaining({ idTokenExpected: false })
      );
    });
  });
});
