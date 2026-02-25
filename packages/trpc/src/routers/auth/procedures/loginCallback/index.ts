import { publicProcedure } from "../../../../procedures/public/index.js";
import { loginCallbackInputSchema, loginCallbackOutputSchema } from "@my-project/shared";
import { OIDCClient } from "../../../../clients/oidc/index.js";
import { TRPCError } from "@trpc/server";

export const authLoginCallbackProcedure = publicProcedure
  .input(loginCallbackInputSchema)
  .output(loginCallbackOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const oidcClient = new OIDCClient(ctx.oidcConfig);
    const url = new URL(input);

    const expectedOrigin = new URL(ctx.portalUrl).origin;
    if (url.origin !== expectedOrigin) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid callback URL origin" });
    }

    const stateFromParams = url.searchParams.get("state");

    if (!ctx.session.login) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No pending login session" });
    }

    const storedState = ctx.session.login.openId.state;
    const codeVerifier = ctx.session.login.openId.codeVerifier;
    const clientSearch = ctx.session.login.clientSearch;

    // Clear login state immediately — single-use
    ctx.session.login = undefined;

    if (!storedState || !codeVerifier || storedState !== stateFromParams) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or mismatched state parameter" });
    }

    const config = await oidcClient.discoverOrThrow();

    const tokens = await oidcClient.exchangeCodeForTokens(config, url, codeVerifier, storedState);

    const normalizedTokens = oidcClient.normalizeTokenResponse(tokens);

    const userInfo = await oidcClient.fetchUserInfoOrThrow(config, tokens.access_token);

    ctx.session.user = {
      data: userInfo,
      secret: normalizedTokens,
    };

    return {
      success: true,
      userInfo: {
        ...userInfo,
        issuerUrl: ctx.oidcConfig.issuerURL || undefined,
      },
      clientSearch,
    };
  });
