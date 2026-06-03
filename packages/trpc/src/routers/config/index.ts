import { t } from "../../trpc.js";
import { protectedProcedure } from "../../procedures/protected/index.js";
import { z } from "zod";

export const configRouter = t.router({
  /**
   * Returns the OIDC issuer URL and whether OIDC is enabled, accessible without
   * authentication. Used by the CLI for OIDC discovery before login, and by the
   * web client to decide whether to render OIDC login controls.
   */
  oidc: t.procedure
    .meta({ openapi: { method: "GET", path: "/v1/config/oidc", protect: false } })
    .input(z.void())
    .output(z.object({ oidcIssuerUrl: z.string(), oidcEnabled: z.boolean() }))
    .query(({ ctx }) => ({
      oidcIssuerUrl: ctx.oidcConfig.issuerURL,
      // OIDC is enabled when an issuer URL is configured. When false, the client
      // hides OIDC login controls and offers only Service Account token login.
      oidcEnabled: !!ctx.oidcConfig.issuerURL,
    })),

  /**
   * Returns server runtime configuration.
   * Requires authentication — internal infrastructure URLs must not be exposed to unauthenticated callers.
   */
  get: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/v1/config", protect: true } })
    .input(z.void())
    .output(
      z.object({
        clusterName: z.string(),
        defaultNamespace: z.string(),
        sonarWebUrl: z.string(),
        dependencyTrackWebUrl: z.string(),
      })
    )
    .query(() => {
      const clusterName = process.env.DEFAULT_CLUSTER_NAME || "";
      const defaultNamespace = process.env.DEFAULT_CLUSTER_NAMESPACE || "";
      const sonarWebUrl = process.env.SONAR_WEB_URL || process.env.SONAR_HOST_URL || "";
      const dependencyTrackWebUrl = process.env.DEPENDENCY_TRACK_WEB_URL || process.env.DEPENDENCY_TRACK_URL || "";

      return {
        clusterName,
        defaultNamespace,
        sonarWebUrl,
        dependencyTrackWebUrl,
      };
    }),
});
