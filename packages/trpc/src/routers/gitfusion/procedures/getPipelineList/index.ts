import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { z } from "zod";
import { createGitFusionClient } from "../../../../clients/gitfusion/index.js";

export const getPipelineListProcedure = protectedProcedure
  .input(
    z.object({
      // clusterName and namespace are accepted for API compatibility but unused —
      // GitFusion uses network policies for cluster-level security.
      clusterName: z.string(),
      namespace: z.string(),
      gitServer: z.string(),
      project: z.string(), // e.g. "krci/my-app" (spec.gitUrlPath without the leading slash)
      ref: z.string().optional(),
      status: z.string().optional(),
      page: z.number().optional(),
      perPage: z.number().optional(),
    })
  )
  .query(async ({ input }) => {
    const { gitServer, project, ref, status, page, perPage } = input;

    const gitFusionClient = createGitFusionClient();
    return gitFusionClient.getPipelines(gitServer, project, { ref, status, page, perPage });
  });
