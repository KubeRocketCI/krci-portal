import { publicProcedure } from "../../../../procedures/public/index.js";
import { loginWithTokenInputSchema, loginWithTokenOutputSchema } from "@my-project/shared";
import { OIDCClient } from "../../../../clients/oidc/index.js";

export const authLoginWithTokenProcedure = publicProcedure
  .input(loginWithTokenInputSchema)
  .output(loginWithTokenOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const { token, redirectSearchParam } = input;
    const oidcClient = new OIDCClient(ctx.oidcConfig);

    const config = await oidcClient.discoverOrThrow();

    const userInfo = await oidcClient.validateTokenAndGetUserInfo(config, token);
    const tokenInfo = oidcClient.validateTokenAndGetTokenInfo(token);

    ctx.session.user = {
      data: userInfo,
      secret: tokenInfo,
    };

    const clientSearch = redirectSearchParam ? `?redirect=${redirectSearchParam}` : "";

    return {
      success: true,
      userInfo: {
        ...userInfo,
        issuerUrl: ctx.oidcConfig.issuerURL || undefined,
      },
      clientSearch,
    };
  });
