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
import { getTokenExpirationTime } from "../../utils/getTokenExpirationTime/index.js";
import { type OIDCUser, OIDCUserSchema } from "@my-project/shared";
import { jwtDecode } from "jwt-decode";

export interface OIDCConfig {
  issuerURL: string;
  clientID: string;
  clientSecret: string;
  scope: string;
  codeChallengeMethod: string;
}
export class OIDCClient {
  private config: OIDCConfig;

  constructor(config: OIDCConfig) {
    if (!config.issuerURL || !config.clientID || !config.clientSecret || !config.scope || !config.codeChallengeMethod) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Server could not initialize OIDC client.",
      });
    }

    this.config = config;
  }

  async discover(): Promise<Configuration> {
    const options = process.env.NODE_ENV === "development" ? { execute: [allowInsecureRequests] } : {};

    try {
      return await discovery(
        new URL(this.config.issuerURL),
        this.config.clientID,
        this.config.clientSecret,
        undefined,
        options
      );
    } catch (err) {
      console.error(err);
      throw err;
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
    try {
      return await authorizationCodeGrant(oidcConfig, url, {
        pkceCodeVerifier: codeVerifier,
        expectedState: expectedState,
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
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

    return {
      idToken,
      idTokenExpiresAt: getTokenExpirationTime(idToken),
      accessToken,
      accessTokenExpiresAt: getTokenExpirationTime(accessToken),
      refreshToken,
    };
  }

  async getNewTokens(oidcConfig: Configuration, refreshToken: string) {
    try {
      const newTokens = await refreshTokenGrant(oidcConfig, refreshToken);

      return this.normalizeTokenResponse(newTokens);
    } catch (err) {
      console.error("Failed to refresh token", err);
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

    const responseText = await response.text();

    if (!response.ok) {
      const statusMessages: Record<number, string> = {
        401: "Token is invalid or expired",
        403: "Token does not have sufficient permissions",
      };

      const statusMessage = statusMessages[response.status] || `Unexpected response (HTTP ${response.status})`;

      throw new Error(statusMessage);
    }

    if (!responseText) {
      throw new Error("Empty response from userinfo endpoint");
    }

    try {
      return JSON.parse(responseText) as OIDCUser;
    } catch {
      throw new Error("Invalid response from userinfo endpoint");
    }
  }

  async getUserInfo(oidcConfig: Configuration, accessToken: string): Promise<OIDCUser> {
    return this.fetchUserInfo(oidcConfig, accessToken);
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
   * 1. If the token is a JWT, decode it and check expiration.
   * 2. Try to extract user claims directly from the JWT payload
   *    (works for ID tokens, which contain user claims inline).
   * 3. If JWT claims are insufficient, fall back to the userinfo
   *    endpoint (works for access tokens).
   */
  async validateTokenAndGetUserInfo(oidcConfig: Configuration, token: string): Promise<OIDCUser> {
    const isJWT = token.split(".").length === 3;

    if (isJWT) {
      let decoded: Record<string, unknown>;

      try {
        decoded = jwtDecode<Record<string, unknown>>(token);
      } catch {
        // Not a valid JWT — skip to userinfo endpoint
        return this.fetchUserInfoOrThrow(oidcConfig, token);
      }

      // Check expiration
      if (typeof decoded.exp === "number") {
        const expiresAt = decoded.exp * 1000;

        if (Date.now() >= expiresAt) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: `Token expired at ${new Date(expiresAt).toISOString()}. Current time: ${new Date(Date.now()).toISOString()}`,
          });
        }
      }

      // Try to extract user claims directly from the JWT payload (ID tokens)
      const parsed = OIDCUserSchema.safeParse(decoded);

      if (parsed.success) {
        return parsed.data;
      }
    }

    // Fall back to userinfo endpoint (access tokens)
    return this.fetchUserInfoOrThrow(oidcConfig, token);
  }

  private async fetchUserInfoOrThrow(oidcConfig: Configuration, token: string): Promise<OIDCUser> {
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
    refreshToken?: string;
  } {
    const DEFAULT_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

    let expiresAt: number;

    try {
      const decoded = jwtDecode<{ exp?: number }>(token);
      expiresAt = decoded.exp ? decoded.exp * 1000 : Date.now() + DEFAULT_EXPIRATION_MS;
    } catch {
      // Opaque token — cannot determine expiration, use default
      expiresAt = Date.now() + DEFAULT_EXPIRATION_MS;
    }

    return {
      idToken: token,
      idTokenExpiresAt: expiresAt,
      accessToken: token,
      accessTokenExpiresAt: expiresAt,
      refreshToken: undefined,
    };
  }
}
