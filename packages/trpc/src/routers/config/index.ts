import { t } from "../../trpc";
import { z } from "zod";

export const configRouter = t.router({
  /**
   * Returns server runtime configuration
   * This includes cluster name and namespace that are set at runtime in K8s
   */
  get: t.procedure
    .output(
      z.object({
        clusterName: z.string(),
        defaultNamespace: z.string(),
      })
    )
    .query(() => {
      const clusterName = process.env.DEFAULT_CLUSTER_NAME || "";
      const defaultNamespace = process.env.DEFAULT_CLUSTER_NAMESPACE || "";

      return {
        clusterName,
        defaultNamespace,
      };  
    }),
});
