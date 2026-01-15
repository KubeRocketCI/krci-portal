import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { z } from "zod";
import { createGitFusionClient } from "../../../../clients/gitfusion/index.js";

export const getBranchListProcedure = protectedProcedure
  .input(
    z.object({
      // Note: clusterName and namespace are accepted for API compatibility
      // but not used - GitFusion uses network policies for cluster-level security
      clusterName: z.string(),
      namespace: z.string(),
      gitServer: z.string(),
      owner: z.string(),
      repoName: z.string(),
    })
  )
  .query(async ({ input }) => {
    const { gitServer, owner, repoName } = input;

    const gitFusionClient = createGitFusionClient();
    return gitFusionClient.getBranches(gitServer, owner, repoName);
  });
