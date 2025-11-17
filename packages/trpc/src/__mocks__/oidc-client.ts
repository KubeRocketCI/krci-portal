import { Configuration, TokenEndpointResponse } from "openid-client";
import { vi } from "vitest";
import { OIDCClient } from "../clients/oidc/index.js";

export function createMockedOIDCClient() {
  vi.mock("openid-client", async () => {
    const actual = await vi.importActual<typeof import("openid-client")>("openid-client");

    const MOCK_CONFIG: Configuration = {} as Configuration;

    const MOCK_TOKENS: TokenEndpointResponse = {
      id_token: "id-token",
      access_token: "access-token",
      refresh_token: "refresh-token",
      token_type: "Bearer",
      expires_in: 3600,
    } as TokenEndpointResponse;

    return {
      ...actual,
      discovery: vi.fn().mockResolvedValue(MOCK_CONFIG),
      buildAuthorizationUrl: vi.fn().mockReturnValue(new URL("https://example.com/auth")),
      authorizationCodeGrant: vi.fn().mockResolvedValue(MOCK_TOKENS),
      refreshTokenGrant: vi.fn().mockResolvedValue({
        ...MOCK_TOKENS,
        id_token: "new-id-token",
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
      }),
      fetchProtectedResource: vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          // copy from session.ts file
          sub: "3705dd06-7992-44aa-85ac-d35e664e87d5",
          email_verified: false,
          name: "John Doe",
          groups: ["group-1", "group-2"],
          preferred_username: "john_doe@world.com",
          default_namespace: "test-namespace",
          given_name: "John",
          family_name: "Doe",
          email: "john_doe@world.com",
          picture: "test-picture",
        }),
      }),
      randomState: vi.fn().mockReturnValue("random-state"),
      randomPKCECodeVerifier: vi.fn().mockReturnValue("verifier123"),
      calculatePKCECodeChallenge: vi.fn().mockResolvedValue("challenge123"),
      allowInsecureRequests: vi.fn(),
    };
  });

  // Mock getTokenExpirationTime import
  vi.mock("@/utils/getTokenExpirationTime", () => ({
    getTokenExpirationTime: vi.fn().mockReturnValue(1234567890),
  }));

  // Create OIDCClient instance
  return new OIDCClient({
    issuerURL: "https://example.com",
    clientID: "client-id",
    clientSecret: "client-secret",
    scope: "profile email",
    codeChallengeMethod: "S256",
  });
}
