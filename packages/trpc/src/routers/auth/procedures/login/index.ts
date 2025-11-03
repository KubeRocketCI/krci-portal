import { publicProcedure } from "../../../../procedures/public";
import { loginInputSchema, loginOutputSchema } from "@my-project/shared";

export const authLoginProcedure = publicProcedure
  .input(loginInputSchema)
  .output(loginOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const clientRedirectURI = new URL(input);
    const { oidcClient } = ctx;

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

    ctx.session.login.clientSearch = clientRedirectURI.search;
    ctx.session.login.openId = { state, codeVerifier };

    clientRedirectURI.search = "";

    const authUrl = oidcClient.generateAuthUrl(clientRedirectURI, config, state, codeChallenge);

    return { authUrl: authUrl.href };
  });
