import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { z } from "zod";
import { createGitFusionClient } from "../../../../clients/gitfusion/index.js";

export const getPipelineJobListProcedure = protectedProcedure
  .input(
    z.object({
      // clusterName and namespace are accepted for API compatibility but unused —
      // GitFusion uses network policies for cluster-level security.
      clusterName: z.string(),
      namespace: z.string(),
      gitServer: z.string(),
      project: z.string(),
      pipelineId: z.string(),
    })
  )
  .query(async ({ input }) => {
    const { gitServer, project, pipelineId } = input;

    const gitFusionClient = createGitFusionClient();
    return gitFusionClient.getPipelineJobs(gitServer, project, pipelineId);
  });
