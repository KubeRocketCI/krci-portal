import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import { issuesQueryParamsSchema, issuesSearchResponseSchema } from "@my-project/shared";
import { notFoundMessage } from "../../utils.js";

/**
 * Paginated issue search for a SonarQube project (via `/api/issues/search`).
 *
 * `pullRequest?` / `branch?` are plumbed through `issuesQueryParamsSchema`
 * so they reach Sonar as `&pullRequest=<id>` / `&branch=<name>` when
 * supplied. The two are mutually exclusive at the SonarQube API layer;
 * `issuesQueryParamsSchema` already rejects callers that send both.
 */
export const getProjectIssuesProcedure = protectedProcedure
  .input(issuesQueryParamsSchema)
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
          message: notFoundMessage(input.componentKeys, input.pullRequest, input.branch),
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
