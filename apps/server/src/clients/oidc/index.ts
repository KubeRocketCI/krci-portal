import * as openIdClient from "openid-client";
import { TRPCError } from "@trpc/server";
import { getTokenExpirationTime } from "@/utils/getTokenExpirationTime";
import type { OIDCUser } from "@my-project/shared";

interface OIDCConfig {
  issuerURL: string;
  clientID: string;
  clientSecret: string;
  scope: string;
  codeChallengeMethod: string;
}
export class OIDCClient {
  private config: OIDCConfig;

  constructor(config: OIDCConfig) {
    if (
      !config.issuerURL ||
      !config.clientID ||
      !config.clientSecret ||
      !config.scope ||
      !config.codeChallengeMethod
    ) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Server could not initialize OIDC client.",
      });
    }

    this.config = config;
  }

  async discover(): Promise<openIdClient.Configuration> {
    const options =
      process.env.NODE_ENV === "development"
        ? { execute: [openIdClient.allowInsecureRequests] }
        : {};

    try {
      return await openIdClient.discovery(
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

  generateAuthUrl(
    clientRedirectURI: URL,
    oidcConfig: openIdClient.Configuration,
    state: string,
    codeChallenge: string
  ): URL {
    return openIdClient.buildAuthorizationUrl(oidcConfig, {
      scope: this.config.scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: this.config.codeChallengeMethod,
      redirect_uri: clientRedirectURI.href,
    });
  }

  async exchangeCodeForTokens(
    oidcConfig: openIdClient.Configuration,
    url: URL,
    codeVerifier: string,
    expectedState: string
  ): Promise<openIdClient.TokenEndpointResponse> {
    try {
      return await openIdClient.authorizationCodeGrant(oidcConfig, url, {
        pkceCodeVerifier: codeVerifier,
        expectedState: expectedState,
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  normalizeTokenResponse(tokenResponse: openIdClient.TokenEndpointResponse): {
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

  async getNewTokens(
    oidcConfig: openIdClient.Configuration,
    refreshToken: string
  ) {
    try {
      const newTokens = await openIdClient.refreshTokenGrant(
        oidcConfig,
        refreshToken
      );

      return this.normalizeTokenResponse(newTokens);
    } catch (err) {
      console.error("Failed to refresh token", err);
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Session expired. Please log in again.",
      });
    }
  }

  async fetchUserInfo(
    oidcConfig: openIdClient.Configuration,
    accessToken: string
  ): Promise<OIDCUser> {
    const userInfoRequest = await openIdClient.fetchProtectedResource(
      oidcConfig,
      accessToken,
      new URL(`${this.config.issuerURL}/protocol/openid-connect/userinfo`),
      "GET"
    );
    return userInfoRequest.json();
  }

  generateState(): string {
    return openIdClient.randomState();
  }

  async generateCodeChallenge(codeVerifier: string): Promise<string> {
    return await openIdClient.calculatePKCECodeChallenge(codeVerifier);
  }

  generateCodeVerifier(): string {
    return openIdClient.randomPKCECodeVerifier();
  }
}
