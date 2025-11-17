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
import type { OIDCUser } from "@my-project/shared";
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
    return {
      idToken: tokenResponse.id_token!,
      idTokenExpiresAt: getTokenExpirationTime(tokenResponse.id_token!), // ms
      accessToken: tokenResponse.access_token!,
      accessTokenExpiresAt: getTokenExpirationTime(tokenResponse.access_token!), // ms
      refreshToken: tokenResponse.refresh_token!,
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
    const userInfoRequest = await fetchProtectedResource(
      oidcConfig,
      accessToken,
      new URL(`${this.config.issuerURL}/protocol/openid-connect/userinfo`),
      "GET"
    );
    return userInfoRequest.json();
  }

  async getUserInfo(oidcConfig: Configuration, accessToken: string): Promise<OIDCUser> {
    return this.fetchUserInfo(oidcConfig, accessToken);
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

  async validateTokenAndGetUserInfo(oidcConfig: Configuration, token: string): Promise<OIDCUser> {
    const isJWT = token.split(".").length === 3;

    if (isJWT) {
      try {
        const decoded = jwtDecode<{ exp?: number; sub?: string; iss?: string; aud?: string }>(token);

        if (decoded.exp) {
          const expiresAt = decoded.exp * 1000;
          const now = Date.now();

          if (now >= expiresAt) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: `Token expired at ${new Date(expiresAt).toISOString()}. Current time: ${new Date(now).toISOString()}`,
            });
          }
        }
      } catch (decodeError) {
        // If decode fails, continue to try fetching user info
      }
    }

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

  validateTokenAndGetTokenInfo(token: string): {
    idToken: string;
    idTokenExpiresAt: number;
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken?: string;
  } {
    try {
      // Try to decode as JWT first
      const decoded = jwtDecode<{ exp?: number; iat?: number }>(token);

      if (decoded.exp) {
        // It's a JWT token, extract expiration
        const expiresAt = decoded.exp * 1000; // Convert to milliseconds

        return {
          idToken: token,
          idTokenExpiresAt: expiresAt,
          accessToken: token, // Use same token for both if it's an ID token
          accessTokenExpiresAt: expiresAt,
          refreshToken: undefined, // Refresh tokens not available in token-based login
        };
      }
    } catch (error) {
      // Not a JWT or failed to decode, treat as opaque access token
      // Use default expiration (5 minutes from now) as we can't determine actual expiration
      const defaultExpiration = Date.now() + 5 * 60 * 1000; // 5 minutes

      return {
        idToken: token,
        idTokenExpiresAt: defaultExpiration,
        accessToken: token,
        accessTokenExpiresAt: defaultExpiration,
        refreshToken: undefined,
      };
    }

    // Fallback: if JWT doesn't have exp claim, use default expiration
    const defaultExpiration = Date.now() + 5 * 60 * 1000; // 5 minutes

    return {
      idToken: token,
      idTokenExpiresAt: defaultExpiration,
      accessToken: token,
      accessTokenExpiresAt: defaultExpiration,
      refreshToken: undefined,
    };
  }
}
