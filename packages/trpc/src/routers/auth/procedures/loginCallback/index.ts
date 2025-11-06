import { publicProcedure } from "../../../../procedures/public";
import { loginCallbackInputSchema, loginCallbackOutputSchema } from "@my-project/shared";
import { OIDCClient } from "../../../../clients/oidc";

export const authLoginCallbackProcedure = publicProcedure
  .input(loginCallbackInputSchema)
  .output(loginCallbackOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const oidcClient = new OIDCClient(ctx.oidcConfig);
    const url = new URL(input);
    const params: URLSearchParams = url.searchParams;
    const stateFromParams = params.get("state");

    if (!ctx.session.login) {
      throw new Error("Session Auth is undefined");
    }

    const storedState = ctx.session.login.openId.state;
    const codeVerifier = ctx.session.login.openId.codeVerifier;

    if (!storedState || !codeVerifier || storedState !== stateFromParams) {
      throw new Error("Invalid state");
    }

    const config = await oidcClient.discover();

    const tokens = await oidcClient.exchangeCodeForTokens(config, url, codeVerifier, storedState);

    const normalizedTokens = oidcClient.normalizeTokenResponse(tokens);

    const userInfo = await oidcClient.fetchUserInfo(config, tokens.access_token);

    ctx.session.user = {
      data: userInfo,
      secret: normalizedTokens,
    };

    const response = {
      success: true,
      userInfo,
      clientSearch: ctx.session.login.clientSearch,
    };

    ctx.session.login = undefined;

    return response;
  });
