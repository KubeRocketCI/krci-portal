import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import { issuesQueryParamsSchema, issuesSearchResponseSchema } from "@my-project/shared";

/**
 * Get issues for a SonarQube project with pagination and filtering
 *
 * Fetches issues from SonarQube with support for:
 * - Filtering by type (BUG, VULNERABILITY, CODE_SMELL)
 * - Filtering by severity (BLOCKER, CRITICAL, MAJOR, MINOR, INFO)
 * - Server-side pagination
 * - Only unresolved issues by default
 *
 * @input IssuesQueryParams - Component key, filters, pagination
 * @returns Paginated issues list with total count
 *
 * @example
 * const issues = await trpc.sonarqube.getProjectIssues.query({
 *   componentKeys: "my-service",
 *   types: "BUG,VULNERABILITY",
 *   severities: "BLOCKER,CRITICAL",
 *   p: 1,
 *   ps: 25
 * });
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
