import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import { issuesQueryParamsSchema, issuesSearchResponseSchema } from "@my-project/shared";

/**
 * Paginated issue search for a SonarQube project (via `/api/issues/search`).
 *
 * `pullRequest?` is plumbed through `issuesQueryParamsSchema` so it reaches
 * Sonar as `&pullRequest=<id>` when supplied.
 */
export const getProjectIssuesProcedure = protectedProcedure
  .input(issuesQueryParamsSchema.strict())
  .output(issuesSearchResponseSchema)
  .query(async ({ input }) => {
    const sonarqubeClient = createSonarQubeClient();

    try {
      const issuesResponse = await sonarqubeClient.getIssues(input);
      console.info(`[SonarQube] Found ${issuesResponse.total} issues for ${input.componentKeys}`);
      return issuesResponse;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error(`[SonarQube] Failed to fetch issues for ${input.componentKeys}:`, error);
      if (error instanceof Error && /:\s*404\b/.test(error.message)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: input.pullRequest
            ? `pull request ${input.pullRequest} not found`
            : `project ${input.componentKeys} not found`,
          cause: error,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `SonarQube upstream failure for ${input.componentKeys}`,
        cause: error,
      });
    }
  });
