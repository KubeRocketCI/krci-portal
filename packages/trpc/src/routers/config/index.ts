import { t } from "../../trpc.js";
import { protectedProcedure } from "../../procedures/protected/index.js";
import { z } from "zod";

export const configRouter = t.router({
  /**
   * Returns only the OIDC issuer URL, accessible without authentication.
   * Used by CLI for OIDC discovery before login.
   */
  oidc: t.procedure
    .meta({ openapi: { method: "GET", path: "/v1/config/oidc", protect: false } })
    .input(z.void())
    .output(z.object({ oidcIssuerUrl: z.string() }))
    .query(({ ctx }) => ({
      oidcIssuerUrl: ctx.oidcConfig.issuerURL,
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
