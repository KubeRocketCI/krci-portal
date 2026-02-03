import { t } from "../../trpc.js";
import { z } from "zod";

export const configRouter = t.router({
  /**
   * Returns server runtime configuration
   * This includes cluster name, namespace, and external tool URLs that are set at runtime in K8s
   */
  get: t.procedure
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
