import {
  Configuration,
  TokenEndpointResponse,
  allowInsecureRequests,
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  discovery,
  fetchProtectedResource,
  randomPKCECodeVerifier,
  randomState,
  refreshTokenGrant,
} from "openid-client";
import { TRPCError } from "@trpc/server";
import { type OIDCUser, OIDCUserSchema, tryParseJsonArray } from "@my-project/shared";
import { createRemoteJWKSet, errors as joseErrors, jwtVerify } from "jose";

import { getTokenExpirationTime } from "../../utils/getTokenExpirationTime/index.js";

/**
 * Normalize the groups claim from OIDC providers.
 * Some providers (e.g., AzureAD) may return groups as:
 * - A JSON-encoded string: '["group1","group2"]'
 * - An array with a single JSON-encoded string element: ['["group1","group2"]']
 * This function ensures groups is always a proper string array.
 */
function normalizeGroups(groups: unknown): string[] | undefined {
  if (!groups) return undefined;

  if (Array.isArray(groups)) {
    // Check if the array contains a single JSON-encoded array string
    if (groups.length === 1 && typeof groups[0] === "string") {
      const parsed = tryParseJsonArray(groups[0]);
      if (parsed) return parsed;
    }
    return groups.map(String);
  }

  if (typeof groups === "string") {
    return tryParseJsonArray(groups) ?? [groups];
  }

  return undefined;
}

function normalizeUserGroups(user: OIDCUser): OIDCUser {
  return {
    ...user,
    groups: normalizeGroups(user.groups),
  };
}

function looksLikeJWT(token: string): boolean {
  return token.split(".").length === 3;
}

export interface OIDCConfig {
  issuerURL: string;
  clientID: string;
  clientSecret: string;
  scope: string;
  codeChallengeMethod: string;
}
export class OIDCClient {
  private config: OIDCConfig;
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private jwksCacheKey: string | null = null;

  constructor(config: OIDCConfig) {
    if (!config.issuerURL || !config.clientID || !config.clientSecret || !config.scope || !config.codeChallengeMethod) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Server could not initialize OIDC client.",
      });
    }

    this.config = config;
  }

  private getJWKS(jwksUri: string, issuer: string): ReturnType<typeof createRemoteJWKSet> {
    const cacheKey = `${issuer}::${jwksUri}`;
    if (!this.jwks || this.jwksCacheKey !== cacheKey) {
      this.jwks = createRemoteJWKSet(new URL(jwksUri));
      this.jwksCacheKey = cacheKey;
    }
    return this.jwks;
  }

  async discover(): Promise<Configuration> {
    const options = process.env.NODE_ENV === "development" ? { execute: [allowInsecureRequests] } : {};

    return discovery(
      new URL(this.config.issuerURL),
      this.config.clientID,
      this.config.clientSecret,
      undefined,
      options
    );
  }

  async discoverOrThrow(): Promise<Configuration> {
    try {
      return await this.discover();
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      console.error("[OIDC] Discovery failed", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to connect to the identity provider.",
      });
    }
  }

  generateAuthUrl(clientRedirectURI: URL, oidcConfig: Configuration, state: string, codeChallenge: string): URL {
    return buildAuthorizationUrl(oidcConfig, {
      scope: this.config.scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: this.config.codeChallengeMethod,
      redirect_uri: clientRedirectURI.href,
    });
  }

  async exchangeCodeForTokens(
    oidcConfig: Configuration,
    url: URL,
    codeVerifier: string,
    expectedState: string
  ): Promise<TokenEndpointResponse> {
    return authorizationCodeGrant(oidcConfig, url, {
      pkceCodeVerifier: codeVerifier,
      expectedState,
    });
  }

  normalizeTokenResponse(tokenResponse: TokenEndpointResponse): {
    idToken: string;
    idTokenExpiresAt: number; // ms
    accessToken: string;
    accessTokenExpiresAt: number; // ms
    refreshToken: string;
  } {
    const accessToken = tokenResponse.access_token;
    const idToken = tokenResponse.id_token || accessToken;
    const refreshToken = tokenResponse.refresh_token || "";

    if (!accessToken) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "OIDC token response missing access_token",
      });
    }

    // Access tokens may be opaque (e.g. Azure AD) and cannot be JWT-decoded.
    // Use expires_in from the token response, fall back to JWT decode for
    // providers that return JWT access tokens (e.g. Keycloak).
    const accessTokenExpiresAt = this.getTokenExpiresAt(accessToken, tokenResponse.expires_in);

    return {
      idToken,
      idTokenExpiresAt: this.getTokenExpiresAt(idToken, tokenResponse.expires_in),
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
    };
  }

  private getTokenExpiresAt(token: string, expiresIn?: number): number {
    if (looksLikeJWT(token)) {
      try {
        return getTokenExpirationTime(token);
      } catch {
        // Token looks like a JWT but failed to decode, fall through
      }
    }

    if (expiresIn) {
      return Date.now() + expiresIn * 1000;
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to determine access token expiration",
    });
  }

  async getNewTokens(oidcConfig: Configuration, refreshToken: string) {
    try {
      const newTokens = await refreshTokenGrant(oidcConfig, refreshToken);

      return this.normalizeTokenResponse(newTokens);
    } catch (err) {
      console.error("[OIDC] Failed to refresh token", err);
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Session expired. Please log in again.",
      });
    }
  }

  async fetchUserInfo(oidcConfig: Configuration, accessToken: string): Promise<OIDCUser> {
    const userinfoEndpoint = oidcConfig.serverMetadata().userinfo_endpoint;

    if (!userinfoEndpoint) {
      throw new Error("OIDC provider does not advertise a userinfo endpoint");
    }

    const response = await fetchProtectedResource(oidcConfig, accessToken, new URL(userinfoEndpoint), "GET");

    if (!response.ok) {
      const statusMessages: Record<number, string> = {
        401: "Token is invalid or expired",
        403: "Token does not have sufficient permissions",
      };

      const statusMessage = statusMessages[response.status] || `Unexpected response (HTTP ${response.status})`;

      throw new Error(statusMessage);
    }

    const responseText = await response.text();

    if (!responseText) {
      throw new Error("Empty response from userinfo endpoint");
    }

    let raw: unknown;
    try {
      raw = JSON.parse(responseText);
    } catch {
      throw new Error("Invalid response from userinfo endpoint");
    }

    const parsed = OIDCUserSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error("Invalid user info response from userinfo endpoint");
    }
    return normalizeUserGroups(parsed.data);
  }

  buildEndSessionUrl(
    oidcConfig: Configuration,
    idTokenHint?: string,
    postLogoutRedirectUri?: string
  ): string | undefined {
    const endSessionEndpoint = oidcConfig.serverMetadata().end_session_endpoint;

    if (!endSessionEndpoint) {
      return undefined;
    }

    const url = new URL(endSessionEndpoint);

    if (idTokenHint) {
      url.searchParams.set("id_token_hint", idTokenHint);
    }
    if (postLogoutRedirectUri) {
      url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
    }

    return url.toString();
  }

  generateState(): string {
    return randomState();
  }

  async generateCodeChallenge(codeVerifier: string): Promise<string> {
    return await calculatePKCECodeChallenge(codeVerifier);
  }

  generateCodeVerifier(): string {
    return randomPKCECodeVerifier();
  }

  /**
   * Validates the token and retrieves user information.
   *
   * Strategy:
   * 1. If the token is a JWT and the provider exposes a JWKS endpoint,
   *    verify the signature cryptographically using jose (per OIDC Core §3.1.3.7).
   * 2. If the verified payload satisfies OIDCUserSchema, return claims directly.
   * 3. Otherwise fall back to the userinfo endpoint (works for access tokens,
   *    opaque tokens, or JWTs whose audience doesn't match this client).
   */
  async validateTokenAndGetUserInfo(oidcConfig: Configuration, token: string): Promise<OIDCUser> {
    const isJWT = looksLikeJWT(token);

    if (isJWT) {
      const metadata = oidcConfig.serverMetadata();
      const jwksUri = metadata.jwks_uri;

      if (jwksUri) {
        try {
          const jwks = this.getJWKS(jwksUri, metadata.issuer);
          const { payload } = await jwtVerify(token, jwks, {
            issuer: metadata.issuer,
            audience: this.config.clientID,
            clockTolerance: 30,
            algorithms: ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "PS256", "PS384", "PS512"],
          });

          const parsed = OIDCUserSchema.safeParse(payload);
          if (parsed.success) {
            return normalizeUserGroups(parsed.data);
          }
        } catch (err) {
          // Audience mismatch is expected for access tokens — fall back to userinfo
          const isAudienceMismatch = err instanceof joseErrors.JWTClaimValidationFailed && err.claim === "aud";

          if (isAudienceMismatch) {
            console.warn("[OIDC] JWT audience mismatch, falling back to userinfo endpoint");
          } else if (err instanceof joseErrors.JOSEError) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: `JWT verification failed: ${err.message}`,
            });
          } else {
            console.error("[OIDC] Unexpected error during JWT verification", err);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Unable to verify token signature. Please try again later.",
            });
          }
        }
      }
    }

    return this.fetchUserInfoOrThrow(oidcConfig, token);
  }

  async fetchUserInfoOrThrow(oidcConfig: Configuration, token: string): Promise<OIDCUser> {
    try {
      return await this.fetchUserInfo(oidcConfig, token);
    } catch (error) {
      const errorMessage = (error as Error)?.message || "Unknown error";
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `Token validation failed: ${errorMessage}. Please check your token and try again.`,
      });
    }
  }

  /**
   * Extracts token metadata for token-based login (no authorization code flow).
   *
   * In token-based login the user provides a single token (typically an access token
   * obtained via kubectl or another OIDC client). Since we only have one token,
   * it is stored in both idToken and accessToken session fields. No refresh token
   * is available in this flow, so sessions expire when the token does.
   */
  validateTokenAndGetTokenInfo(token: string): {
    idToken: string;
    idTokenExpiresAt: number;
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
  } {
    const DEFAULT_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
    const MAX_SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

    let expiresAt: number;

    try {
      expiresAt = getTokenExpirationTime(token);
    } catch {
      // Opaque token or missing exp — cannot determine expiration, use default
      expiresAt = Date.now() + DEFAULT_EXPIRATION_MS;
    }

    // Cap expiration to prevent attacker-controlled far-future exp claims
    expiresAt = Math.min(expiresAt, Date.now() + MAX_SESSION_DURATION_MS);

    return {
      idToken: token,
      idTokenExpiresAt: expiresAt,
      accessToken: token,
      accessTokenExpiresAt: expiresAt,
      refreshToken: "",
    };
  }
}
