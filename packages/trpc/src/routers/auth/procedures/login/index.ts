import { publicProcedure } from "../../../../procedures/public/index.js";
import { loginInputSchema, loginOutputSchema } from "@my-project/shared";
import { OIDCClient } from "../../../../clients/oidc/index.js";

export const authLoginProcedure = publicProcedure
  .input(loginInputSchema)
  .output(loginOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const redirectURI = new URL(input, ctx.portalUrl);
    const oidcClient = new OIDCClient(ctx.oidcConfig);

    const config = await oidcClient.discover();
    const state = oidcClient.generateState();
    const codeVerifier = oidcClient.generateCodeVerifier();
    const codeChallenge = await oidcClient.generateCodeChallenge(codeVerifier);

    if (!ctx.session.login) {
      ctx.session.login = {
        clientSearch: "",
        openId: {
          state: undefined,
          codeVerifier: undefined,
        },
      };
    }

    ctx.session.login.clientSearch = redirectURI.search;
    ctx.session.login.openId = { state, codeVerifier };

    redirectURI.search = "";

    const authUrl = oidcClient.generateAuthUrl(redirectURI, config, state, codeChallenge);

    return { authUrl: authUrl.href };
  });
