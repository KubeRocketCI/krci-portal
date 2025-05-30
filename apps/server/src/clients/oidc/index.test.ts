// import { describe, it, expect, vi, beforeEach } from "vitest";
// import {
//   Configuration,
//   TokenEndpointResponse,
//   TokenEndpointResponseHelpers,
// } from "openid-client";
// import { TRPCError } from "@trpc/server";
// import { OIDCClient } from ".";
// import { getTokenExpirationTime } from "@/utils/getTokenExpirationTime";

// // Mock the getTokenExpirationTime utility
// vi.mock("@/utils/getTokenExpirationTime", () => ({
//   getTokenExpirationTime: vi.fn(),
// }));

// // Mock openid-client
// vi.mock("openid-client", async () => {
//   const actual = await vi.importActual("openid-client");
//   return {
//     ...actual,
//     discovery: vi.fn(),
//     buildAuthorizationUrl: vi.fn(),
//     authorizationCodeGrant: vi.fn(),
//     refreshTokenGrant: vi.fn(),
//     fetchProtectedResource: vi.fn(),
//     randomState: vi.fn(),
//     randomPKCECodeVerifier: vi.fn(),
//     calculatePKCECodeChallenge: vi.fn(),
//     allowInsecureRequests: vi.fn(),
//   };
// });

// describe("OIDCClient", () => {
//   const config = {
//     issuerURL: "https://example.com",
//     clientID: "client-id",
//     clientSecret: "client-secret",
//     scope: "openid profile",
//     codeChallengeMethod: "S256",
//   };

//   let client: OIDCClient;

//   beforeEach(() => {
//     client = new OIDCClient(config);
//     vi.clearAllMocks();
//   });

//   describe("constructor", () => {
//     it("should initialize with valid config", () => {
//       expect(client).toBeInstanceOf(OIDCClient);
//     });

//     it("should throw TRPCError if config is incomplete", () => {
//       expect(() => new OIDCClient({ ...config, issuerURL: "" })).toThrowError(
//         new TRPCError({
//           code: "INTERNAL_SERVER_ERROR",
//           message: "Server could not initialize OIDC client.",
//         })
//       );
//     });
//   });

//   describe("discover", () => {
//     it("should call discovery with correct parameters in production", async () => {
//       const mockConfig = { issuer: "https://example.com" };
//       vi.spyOn(openIdClient, "discovery").mockResolvedValue(
//         mockConfig as unknown as Configuration
//       );

//       const result = await client.discover();

//       expect(openIdClient.discovery).toHaveBeenCalledWith(
//         new URL(config.issuerURL),
//         config.clientID,
//         config.clientSecret,
//         undefined,
//         {}
//       );
//       expect(result).toBe(mockConfig);
//     });

//     it("should use allowInsecureRequests in development", async () => {
//       vi.stubEnv("NODE_ENV", "development");
//       const mockConfig = { issuer: "https://example.com" };
//       vi.spyOn(openIdClient, "discovery").mockResolvedValue(
//         mockConfig as unknown as Configuration
//       );

//       await client.discover();

//       expect(openIdClient.discovery).toHaveBeenCalledWith(
//         new URL(config.issuerURL),
//         config.clientID,
//         config.clientSecret,
//         undefined,
//         { execute: [openIdClient.allowInsecureRequests] }
//       );
//       vi.unstubAllEnvs();
//     });

//     it("should throw error on discovery failure", async () => {
//       const error = new Error("Discovery failed");
//       vi.spyOn(openIdClient, "discovery").mockRejectedValue(error);

//       await expect(client.discover()).rejects.toThrow(error);
//     });
//   });

//   describe("generateAuthUrl", () => {
//     it("should generate authorization URL with correct parameters", () => {
//       const mockConfig = { issuer: "https://example.com" };
//       const redirectURI = new URL("https://redirect.com");
//       const state = "state123";
//       const codeChallenge = "codeChallenge123";
//       const mockAuthUrl = new URL("https://example.com/auth");

//       vi.spyOn(openIdClient, "buildAuthorizationUrl").mockReturnValue(
//         mockAuthUrl
//       );

//       const result = client.generateAuthUrl(
//         redirectURI,
//         mockConfig as unknown as openIdClient.Configuration,
//         state,
//         codeChallenge
//       );

//       expect(openIdClient.buildAuthorizationUrl).toHaveBeenCalledWith(
//         mockConfig,
//         {
//           scope: config.scope,
//           state,
//           code_challenge: codeChallenge,
//           code_challenge_method: config.codeChallengeMethod,
//           redirect_uri: redirectURI.href,
//         }
//       );
//       expect(result).toBe(mockAuthUrl);
//     });
//   });

//   describe("exchangeCodeForTokens", () => {
//     it("should exchange code for tokens successfully", async () => {
//       const mockConfig = { issuer: "https://example.com" };
//       const url = new URL("https://example.com/callback?code=abc");
//       const codeVerifier = "verifier123";
//       const expectedState = "state123";
//       const mockTokens = {
//         id_token: "id-token",
//         access_token: "access-token",
//         refresh_token: "refresh-token",
//       };

//       vi.spyOn(openIdClient, "authorizationCodeGrant").mockResolvedValue(
//         mockTokens as unknown as TokenEndpointResponse &
//           TokenEndpointResponseHelpers
//       );

//       const result = await client.exchangeCodeForTokens(
//         mockConfig as unknown as openIdClient.Configuration,
//         url,
//         codeVerifier,
//         expectedState
//       );

//       expect(openIdClient.authorizationCodeGrant).toHaveBeenCalledWith(
//         mockConfig,
//         url,
//         {
//           pkceCodeVerifier: codeVerifier,
//           expectedState,
//         }
//       );
//       expect(result).toBe(mockTokens);
//     });

//     it("should throw error on token exchange failure", async () => {
//       const mockConfig = { issuer: "https://example.com" };
//       const error = new Error("Token exchange failed");
//       vi.spyOn(openIdClient, "authorizationCodeGrant").mockRejectedValue(error);

//       await expect(
//         client.exchangeCodeForTokens(
//           mockConfig as unknown as openIdClient.Configuration,
//           new URL("https://example.com/callback"),
//           "verifier",
//           "state"
//         )
//       ).rejects.toThrow(error);
//     });
//   });

//   describe("normalizeTokenResponse", () => {
//     it("should normalize token response correctly", () => {
//       const mockTokens = {
//         id_token: "id-token",
//         access_token: "access-token",
//         refresh_token: "refresh-token",
//       };
//       vi.mocked(getTokenExpirationTime)
//         .mockReturnValueOnce(1234567890)
//         .mockReturnValueOnce(1234567891);

//       const result = client.normalizeTokenResponse(
//         mockTokens as unknown as openIdClient.TokenEndpointResponse &
//           openIdClient.TokenEndpointResponseHelpers
//       );

//       expect(result).toEqual({
//         idToken: "id-token",
//         idTokenExpiresAt: 1234567890,
//         accessToken: "access-token",
//         accessTokenExpiresAt: 1234567891,
//         refreshToken: "refresh-token",
//       });
//       expect(getTokenExpirationTime).toHaveBeenCalledWith("id-token");
//       expect(getTokenExpirationTime).toHaveBeenCalledWith("access-token");
//     });
//   });

//   describe("getNewTokens", () => {
//     it("should refresh tokens successfully", async () => {
//       const mockConfig = { issuer: "https://example.com" };
//       const refreshToken = "refresh-token";
//       const mockTokens = {
//         id_token: "new-id-token",
//         access_token: "new-access-token",
//         refresh_token: "new-refresh-token",
//       };
//       vi.spyOn(openIdClient, "refreshTokenGrant").mockResolvedValue(
//         mockTokens as unknown as openIdClient.TokenEndpointResponse &
//           openIdClient.TokenEndpointResponseHelpers
//       );
//       vi.mocked(getTokenExpirationTime).mockReturnValue(1234567890);

//       const result = await client.getNewTokens(
//         mockConfig as unknown as openIdClient.Configuration,
//         refreshToken
//       );

//       expect(openIdClient.refreshTokenGrant).toHaveBeenCalledWith(
//         mockConfig,
//         refreshToken
//       );
//       expect(result).toEqual({
//         idToken: "new-id-token",
//         idTokenExpiresAt: 1234567890,
//         accessToken: "new-access-token",
//         accessTokenExpiresAt: 1234567890,
//         refreshToken: "new-refresh-token",
//       });
//     });

//     it("should throw TRPCError on refresh failure", async () => {
//       const mockConfig = { issuer: "https://example.com" };
//       vi.spyOn(openIdClient, "refreshTokenGrant").mockRejectedValue(
//         new Error("Refresh failed")
//       );

//       await expect(
//         client.getNewTokens(
//           mockConfig as unknown as openIdClient.Configuration,
//           "refresh-token"
//         )
//       ).rejects.toThrowError(
//         new TRPCError({
//           code: "UNAUTHORIZED",
//           message: "Session expired. Please log in again.",
//         })
//       );
//     });
//   });

//   describe("fetchUserInfo", () => {
//     it("should fetch user info successfully", async () => {
//       const mockConfig = { issuer: "https://example.com" };
//       const accessToken = "access-token";
//       const mockUserInfo = { sub: "123", name: "Test User" };
//       const mockResponse = { json: vi.fn().mockResolvedValue(mockUserInfo) };

//       vi.spyOn(openIdClient, "fetchProtectedResource").mockResolvedValue(
//         mockResponse as unknown as Response
//       );

//       const result = await client.fetchUserInfo(
//         mockConfig as unknown as openIdClient.Configuration,
//         accessToken
//       );

//       expect(openIdClient.fetchProtectedResource).toHaveBeenCalledWith(
//         mockConfig,
//         accessToken,
//         new URL(`${config.issuerURL}/protocol/openid-connect/userinfo`),
//         "GET"
//       );
//       expect(result).toBe(mockUserInfo);
//     });
//   });

//   describe("generateState", () => {
//     it("should generate random state", () => {
//       const mockState = "random-state";
//       vi.spyOn(openIdClient, "randomState").mockReturnValue(mockState);

//       const result = client.generateState();

//       expect(openIdClient.randomState).toHaveBeenCalled();
//       expect(result).toBe(mockState);
//     });
//   });

//   describe("generateCodeChallenge", () => {
//     it("should generate code challenge", async () => {
//       const codeVerifier = "verifier123";
//       const mockChallenge = "challenge123";
//       vi.spyOn(openIdClient, "calculatePKCECodeChallenge").mockResolvedValue(
//         mockChallenge
//       );

//       const result = await client.generateCodeChallenge(codeVerifier);

//       expect(openIdClient.calculatePKCECodeChallenge).toHaveBeenCalledWith(
//         codeVerifier
//       );
//       expect(result).toBe(mockChallenge);
//     });
//   });

//   describe("generateCodeVerifier", () => {
//     it("should generate random code verifier", () => {
//       const mockVerifier = "verifier123";
//       vi.spyOn(openIdClient, "randomPKCECodeVerifier").mockReturnValue(
//         mockVerifier
//       );

//       const result = client.generateCodeVerifier();

//       expect(openIdClient.randomPKCECodeVerifier).toHaveBeenCalled();
//       expect(result).toBe(mockVerifier);
//     });
//   });
// });
