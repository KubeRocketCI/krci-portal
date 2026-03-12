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

import { getJwtPayloadClaim } from "../../utils/jwt/index.js";
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

const SESSION_EXPIRED_ERROR = {
  code: "UNAUTHORIZED" as const,
  message: "Session expired. Please log in again.",
};

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

  private hasScope(name: string): boolean {
    return this.config.scope.split(/\s+/).includes(name);
  }

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
      idTokenExpected: this.hasScope("openid"),
    });
  }

  /**
   * Normalizes a token endpoint response for initial authentication (code exchange).
   *
   * When scope includes "openid", the id_token is guaranteed to be present because
   * exchangeCodeForTokens sets idTokenExpected: true (OIDC Core §3.1.3.3).
   * The id_token || accessToken fallback only applies to non-openid scopes where
   * no id_token is expected, and the access_token serves as the session identity.
   */
  normalizeTokenResponse(tokenResponse: TokenEndpointResponse): {
    idToken: string;
    idTokenExpiresAt: number; // ms
    accessToken: string;
    accessTokenExpiresAt: number; // ms
    refreshToken: string;
  } {
    const accessToken = tokenResponse.access_token;
    const refreshToken = tokenResponse.refresh_token || "";

    if (!accessToken) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "OIDC token response missing access_token",
      });
    }

    if (this.hasScope("openid") && !tokenResponse.id_token) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "OIDC token response missing id_token for openid flow (OIDC Core §3.1.3.3)",
      });
    }

    const idToken = tokenResponse.id_token || accessToken;
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

  /**
   * Refreshes tokens per OIDC Core §12.2 and RFC 6749 §6.
   *
   * Handles each token according to its spec definition:
   * - access_token: Always present in refresh response (RFC 6749 §5.1)
   * - id_token: Optional — "might not contain an id_token" (OIDC §12.2).
   *   If absent, the current id_token is preserved (the client already has it).
   * - refresh_token: IdP may rotate it (RFC 6749 §6); preserve current if not rotated.
   *
   * Does NOT pass scope to refreshTokenGrant because Azure AD v1.0 returns
   * unsigned id_tokens (alg: "none") when scope includes "openid", which
   * oauth4webapi rejects as an unexpected algorithm.
   */
  async getNewTokens(
    oidcConfig: Configuration,
    currentSecret: { idToken: string; idTokenExpiresAt: number; refreshToken: string }
  ): Promise<{
    idToken: string;
    idTokenExpiresAt: number;
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
  }> {
    try {
      const response = await refreshTokenGrant(oidcConfig, currentSecret.refreshToken);

      if (!response.access_token) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "OIDC refresh response missing access_token",
        });
      }

      // 1. access_token — always present in refresh response (RFC 6749 §5.1)
      const accessToken = response.access_token;
      const accessTokenExpiresAt = this.getTokenExpiresAt(accessToken, response.expires_in);

      // 2. refresh_token — IdP may rotate it (RFC 6749 §6); preserve current if not rotated
      const refreshToken = response.refresh_token || currentSecret.refreshToken;

      // 3. id_token — optional per OIDC Core §12.2 ("might not contain an id_token")
      //    If present and valid JWT, use the new one.
      //    If absent, preserve the current one (client already obtained it at login).
      let idToken: string;
      let idTokenExpiresAt: number;

      if (response.id_token && looksLikeJWT(response.id_token)) {
        if (looksLikeJWT(currentSecret.idToken)) {
          try {
            const currentSub = getJwtPayloadClaim(currentSecret.idToken, "sub");
            const newSub = getJwtPayloadClaim(response.id_token, "sub");
            if (typeof currentSub === "string" && typeof newSub === "string" && currentSub !== newSub) {
              console.error("[OIDC] id_token subject changed during refresh — possible token substitution");
              throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Identity changed during token refresh. Please log in again.",
              });
            }
          } catch (err) {
            if (err instanceof TRPCError) throw err;
            console.warn("[OIDC] Could not verify id_token subject during refresh, skipping subject check");
          }
        }
        idToken = response.id_token;
        idTokenExpiresAt = this.getTokenExpiresAt(response.id_token, response.expires_in);
      } else if (looksLikeJWT(currentSecret.idToken)) {
        try {
          const actualExp = getTokenExpirationTime(currentSecret.idToken);
          if (actualExp <= Date.now()) {
            console.error("[OIDC] Current JWT id_token is expired. Forcing re-login.");
            throw new TRPCError(SESSION_EXPIRED_ERROR);
          }
          if (!response.id_token) {
            console.warn("[OIDC] Refresh response missing id_token, preserving current JWT id_token (OIDC §12.2)");
          } else {
            console.warn("[OIDC] Refresh response returned non-JWT id_token, preserving current JWT id_token");
          }
          idToken = currentSecret.idToken;
          idTokenExpiresAt = actualExp;
        } catch (err) {
          if (err instanceof TRPCError) throw err;
          console.error("[OIDC] Failed to validate current id_token. Forcing re-login.");
          throw new TRPCError(SESSION_EXPIRED_ERROR);
        }
      } else {
        console.error("[OIDC] No valid JWT id_token available after refresh. Forcing re-login.");
        throw new TRPCError(SESSION_EXPIRED_ERROR);
      }

      return { idToken, idTokenExpiresAt, accessToken, accessTokenExpiresAt, refreshToken };
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      console.error("[OIDC] Failed to refresh token", err);
      throw new TRPCError(SESSION_EXPIRED_ERROR);
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
