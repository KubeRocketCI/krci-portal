import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { z } from "zod";
import { createGitFusionClient } from "../../../../clients/gitfusion/index.js";

export const invalidateBranchListCacheProcedure = protectedProcedure
  .input(
    z.object({
      // Note: clusterName and namespace are accepted for API compatibility
      // but not used - GitFusion uses network policies for cluster-level security
      clusterName: z.string(),
      namespace: z.string(),
    })
  )
  .mutation(async () => {
    const gitFusionClient = createGitFusionClient();
    return gitFusionClient.invalidateCache("branches");
  });
