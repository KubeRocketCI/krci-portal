import { TRPCError } from "@trpc/server";
import type { Configuration } from "openid-client";
import type { FastifyRequest } from "fastify";
import { type OIDCUser, stripTrailingSlash } from "@my-project/shared";
import { ERROR_NO_SESSION_FOUND, ERROR_TOKEN_EXPIRED } from "../../routers/auth/errors/index.js";
import { OIDCClient, type OIDCConfig } from "../../clients/oidc/index.js";
import { getJwtPayloadClaim } from "../../utils/jwt/index.js";
import { authenticateServiceAccountToken } from "../../utils/authenticateServiceAccountToken/index.js";
import { type TokenInfo } from "../../utils/buildTokenInfoFromToken/index.js";
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

/**
 * Decides whether a Bearer token should be validated via OIDC or via the
 * Kubernetes Service Account path (SelfSubjectReview).
 *
 * - OIDC unconfigured → always SA (the only option in SA-only deployments).
 * - Token's `iss` matches the configured OIDC issuer → OIDC.
 * - Token is opaque or has a foreign `iss` (e.g. a cluster SA token whose issuer
 *   is the API server) → SA.
 *
 * Routing is an optimization, not a trust decision: each path independently
 * validates the token (OIDC signature/userinfo, or cluster SelfSubjectReview),
 * so a token cannot bypass validation by influencing the route.
 */
function shouldUseOidc(token: string, oidcConfig: OIDCConfig): boolean {
  if (!oidcConfig.issuerURL) {
    return false;
  }

  let iss: unknown;
  try {
    iss = getJwtPayloadClaim(token, "iss");
  } catch {
    // Not a JWT (e.g. an opaque OIDC access token) — route to OIDC, which
    // validates it via userinfo. Legacy Secret-based SA tokens (pre-1.22,
    // non-expiring) are also opaque and would land here; they are unsupported
    // (SelfSubjectReview requires 1.28+) and correctly surface as UNAUTHORIZED.
    return true;
  }

  if (typeof iss !== "string") {
    return true;
  }

  return stripTrailingSlash(iss) === stripTrailingSlash(oidcConfig.issuerURL);
}

export async function authenticateBearerToken(
  token: string,
  oidcConfig: OIDCConfig
): Promise<{ data: OIDCUser; secret: TokenInfo }> {
  if (shouldUseOidc(token, oidcConfig)) {
    const { client, config } = await getOrRefreshDiscovery(oidcConfig);

    const data = await client.validateTokenAndGetUserInfo(config, token);
    const secret = client.validateTokenAndGetTokenInfo(token);

    return { data, secret };
  }

  // Service Account token (or any token in an OIDC-less deployment): validate
  // against the cluster via SelfSubjectReview. CLI clients can therefore present
  // an SA token in the Authorization header in any configuration.
  return authenticateServiceAccountToken(token);
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
