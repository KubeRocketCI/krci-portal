import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { z } from "zod";
import { createGitFusionClient } from "../../../../clients/gitfusion/index.js";

export const getPipelineJobTraceProcedure = protectedProcedure
  .input(
    z.object({
      // clusterName and namespace are accepted for API compatibility but unused —
      // GitFusion uses network policies for cluster-level security.
      clusterName: z.string(),
      namespace: z.string(),
      gitServer: z.string(),
      project: z.string(),
      jobId: z.string(),
    })
  )
  .query(async ({ input }) => {
    const { gitServer, project, jobId } = input;

    const gitFusionClient = createGitFusionClient();
    return gitFusionClient.getJobTrace(gitServer, project, jobId);
  });
