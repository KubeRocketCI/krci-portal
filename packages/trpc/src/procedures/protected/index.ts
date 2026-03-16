import { TRPCError } from "@trpc/server";
import type { Configuration } from "openid-client";
import type { FastifyRequest } from "fastify";
import type { OIDCUser } from "@my-project/shared";
import { ERROR_NO_SESSION_FOUND, ERROR_TOKEN_EXPIRED } from "../../routers/auth/errors/index.js";
import { OIDCClient, type OIDCConfig } from "../../clients/oidc/index.js";
import { t } from "../../trpc.js";

const DISCOVERY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface DiscoveryCache {
  oidcClient: OIDCClient | null;
  discovery: Configuration | null;
  discoveredAt: number;
  issuerURL: string;
  // Deduplicates concurrent discovery requests so only one HTTP call is made.
  inflightDiscovery: Promise<{ client: OIDCClient; config: Configuration }> | null;
}

const discoveryCache: DiscoveryCache = {
  oidcClient: null,
  discovery: null,
  discoveredAt: 0,
  issuerURL: "",
  inflightDiscovery: null,
};

/** @internal */
export function resetBearerCache(): void {
  discoveryCache.oidcClient = null;
  discoveryCache.discovery = null;
  discoveryCache.discoveredAt = 0;
  discoveryCache.issuerURL = "";
  discoveryCache.inflightDiscovery = null;
}

export function extractBearerToken(req: FastifyRequest): string | null {
  const authHeader = req.headers?.authorization;

  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  const token = parts[1];

  if (!token) {
    return null;
  }

  return token;
}

async function getOrRefreshDiscovery(oidcConfig: OIDCConfig): Promise<{ client: OIDCClient; config: Configuration }> {
  const now = Date.now();
  const issuerChanged = oidcConfig.issuerURL !== discoveryCache.issuerURL;
  const cacheExpired = now - discoveryCache.discoveredAt > DISCOVERY_CACHE_TTL_MS;
  const cacheValid =
    discoveryCache.oidcClient !== null && discoveryCache.discovery !== null && !issuerChanged && !cacheExpired;

  if (cacheValid) {
    return {
      client: discoveryCache.oidcClient as OIDCClient,
      config: discoveryCache.discovery as Configuration,
    };
  }

  if (discoveryCache.inflightDiscovery) {
    return discoveryCache.inflightDiscovery;
  }

  discoveryCache.inflightDiscovery = (async () => {
    const client = new OIDCClient(oidcConfig);
    const config = await client.discoverOrThrow();

    discoveryCache.oidcClient = client;
    discoveryCache.discovery = config;
    discoveryCache.discoveredAt = Date.now();
    discoveryCache.issuerURL = oidcConfig.issuerURL;

    return { client, config };
  })();

  try {
    return await discoveryCache.inflightDiscovery;
  } finally {
    discoveryCache.inflightDiscovery = null;
  }
}

export async function authenticateBearerToken(
  token: string,
  oidcConfig: OIDCConfig
): Promise<{
  data: OIDCUser;
  secret: {
    idToken: string;
    idTokenExpiresAt: number;
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
  };
}> {
  const { client, config } = await getOrRefreshDiscovery(oidcConfig);

  const data = await client.validateTokenAndGetUserInfo(config, token);
  const secret = client.validateTokenAndGetTokenInfo(token);

  return { data, secret };
}

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { session } = ctx;

  const sessionUser = session.user;

  // Cookie session takes priority over Bearer token when both are present.
  if (sessionUser) {
    const now = Date.now();
    const { idTokenExpiresAt, accessTokenExpiresAt, refreshToken } = sessionUser.secret;

    const isIdTokenExpired = idTokenExpiresAt && now >= idTokenExpiresAt;
    const isAccessTokenExpired = accessTokenExpiresAt && now >= accessTokenExpiresAt;

    if (isIdTokenExpired || isAccessTokenExpired) {
      if (!refreshToken) {
        throw new TRPCError(ERROR_TOKEN_EXPIRED);
      }

      try {
        const oidcClient = new OIDCClient(ctx.oidcConfig);
        const config = await oidcClient.discover();
        const newTokens = await oidcClient.getNewTokens(config, sessionUser.secret);

        session.user = {
          data: sessionUser.data,
          secret: newTokens,
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError(ERROR_TOKEN_EXPIRED);
      }
    }

    return next();
  }

  const bearerToken = extractBearerToken(ctx.req);

  if (!bearerToken) {
    throw new TRPCError(ERROR_NO_SESSION_FOUND);
  }

  try {
    const authenticatedUser = await authenticateBearerToken(bearerToken, ctx.oidcConfig);

    session.user = authenticatedUser;
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Bearer token authentication failed.",
    });
  }

  return next();
});
