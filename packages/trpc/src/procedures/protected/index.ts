import { TRPCError } from "@trpc/server";
import { ERROR_NO_SESSION_FOUND, ERROR_TOKEN_EXPIRED } from "../../routers/auth/errors/index.js";
import { OIDCClient } from "../../clients/oidc/index.js";
import { t } from "../../trpc.js";

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { session } = ctx;

  const sessionUser = session.user;

  if (!sessionUser) {
    throw new TRPCError(ERROR_NO_SESSION_FOUND);
  }

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
      const newTokens = await oidcClient.getNewTokens(config, refreshToken);

      session.user = {
        data: sessionUser.data,
        secret: newTokens,
      };
    } catch {
      throw new TRPCError(ERROR_TOKEN_EXPIRED);
    }
  }

  return next();
});
