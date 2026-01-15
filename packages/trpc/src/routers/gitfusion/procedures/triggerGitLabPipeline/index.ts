import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { z } from "zod";
import { createGitFusionClient } from "../../../../clients/gitfusion/index.js";

const gitLabPipelineVariableSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const triggerGitLabPipelineProcedure = protectedProcedure
  .input(
    z.object({
      // Note: clusterName and namespace are accepted for API compatibility
      // but not used - GitFusion uses network policies for cluster-level security
      clusterName: z.string(),
      namespace: z.string(),
      gitServer: z.string(),
      project: z.string(),
      ref: z.string(),
      variables: z.array(gitLabPipelineVariableSchema).optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { gitServer, project, ref, variables } = input;
    const gitFusionClient = createGitFusionClient();
    return gitFusionClient.triggerPipeline(gitServer, project, ref, variables);
  });
