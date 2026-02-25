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

// Mock openid-client (fetchProtectedResource used by fetchUserInfo)
const mockFetchProtectedResource = vi.fn();
vi.mock("openid-client", async () => {
  const actual = await vi.importActual("openid-client");
  return {
    ...actual,
    fetchProtectedResource: (...args: any[]) => mockFetchProtectedResource(...args),
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
});
