import { publicProcedure } from "../../../../procedures/public/index.js";
import { logoutOutputSchema, LogoutOutput } from "@my-project/shared";
import { OIDCClient } from "../../../../clients/oidc/index.js";

export const authLogoutProcedure = publicProcedure.output(logoutOutputSchema).mutation(async ({ ctx }) => {
  let endSessionUrl: string | undefined;

  // Only attempt OIDC RP-initiated logout when OIDC is configured. In SA-only
  // deployments (no OIDC), skip it entirely and do a local-only session destroy.
  if (ctx.oidcConfig.issuerURL) {
    try {
      const idToken = ctx.session.user?.secret?.idToken;
      const oidcClient = new OIDCClient(ctx.oidcConfig);
      const config = await oidcClient.discover();

      endSessionUrl = oidcClient.buildEndSessionUrl(config, idToken, ctx.portalUrl);
    } catch {
      // If OIDC discovery fails, proceed with local-only logout
    }
  }

  ctx.session.destroy();

  return {
    success: true,
    endSessionUrl,
  } satisfies LogoutOutput;
});
