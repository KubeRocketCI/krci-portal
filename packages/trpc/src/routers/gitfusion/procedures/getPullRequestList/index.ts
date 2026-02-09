import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { z } from "zod";
import { createGitFusionClient } from "../../../../clients/gitfusion/index.js";

export const getPullRequestListProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      gitServer: z.string(),
      owner: z.string(),
      repoName: z.string(),
      state: z.enum(["open", "closed", "merged", "all"]).optional(),
      page: z.number().optional(),
      perPage: z.number().optional(),
    })
  )
  .query(async ({ input }) => {
    const { gitServer, owner, repoName, state, page, perPage } = input;

    const gitFusionClient = createGitFusionClient();
    return gitFusionClient.getPullRequests(gitServer, owner, repoName, state, page, perPage);
  });
