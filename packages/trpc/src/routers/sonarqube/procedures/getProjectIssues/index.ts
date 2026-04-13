import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import { issuesQueryParamsSchema, issuesSearchResponseSchema } from "@my-project/shared";

/**
 * Paginated issue search for a SonarQube project (via `/api/issues/search`).
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
      console.error(`[SonarQube] Failed to fetch issues for ${input.componentKeys}:`, error);
      throw error;
    }
  });
