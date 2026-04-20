import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import {
  sonarqubeProjectsQueryParamsSchema,
  ProjectWithMetrics,
  SonarQubeProject,
  SONARQUBE_METRIC_KEYS,
} from "@my-project/shared";

// SonarQube `/api/components/search` refuses requests where `p * ps > 10_000`
// with HTTP 400 ("Can return only the first 10000 results"). We short-circuit
// to an empty page so the CLI experience stays consistent with "beyond last
// page → empty result".
const SONARQUBE_SEARCH_MAX_OFFSET = 10_000;

/**
 * Get all SonarQube projects with their metrics and quality gate status
 *
 * This procedure uses a batch approach to minimize API calls:
 * 1. Fetches the list of projects from SonarQube (1 API call)
 * 2. Fetches measures for ALL projects in a single batch request (1 API call)
 * 3. Extracts quality gate status from alert_status metric (no additional API call)
 * 4. Returns combined data for display in the SAST overview
 */
export const getProjectsProcedure = protectedProcedure
  .input(sonarqubeProjectsQueryParamsSchema)
  .query(async ({ input }) => {
    const client = createSonarQubeClient();

    const page = input.page;
    const pageSize = input.pageSize;

    // Proactively short-circuit requests that would exceed SonarQube's hard offset
    // limit. Without this, the upstream returns 400 and we bubble a 500.
    if (page * pageSize > SONARQUBE_SEARCH_MAX_OFFSET) {
      return {
        projects: [],
        paging: { pageIndex: page, pageSize, total: 0 },
      };
    }

    // Step 1: Fetch projects list (1 API call)
    let projectsResponse;
    try {
      projectsResponse = await client.getProjects(input);
    } catch (error) {
      // Defensive: if SonarQube's offset limit changes, still handle 400 as "empty".
      if (error instanceof Error && /:\s*400\b/.test(error.message)) {
        return {
          projects: [],
          paging: { pageIndex: page, pageSize, total: 0 },
        };
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "SonarQube upstream failure while listing projects",
        cause: error,
      });
    }

    // Handle empty projects list
    if (projectsResponse.components.length === 0) {
      return {
        projects: [],
        paging: projectsResponse.paging,
      };
    }

    // Step 2: Extract project keys for batch fetch
    const projectKeys = projectsResponse.components.map((project: SonarQubeProject) => project.key);

    // Step 3: Batch fetch measures for ALL projects (1 API call)
    let measuresByComponent: Record<string, Record<string, string>> = {};

    try {
      const batchMeasuresResponse = await client.getBatchMeasures(projectKeys, SONARQUBE_METRIC_KEYS);
      measuresByComponent = client.parseBatchMeasures(batchMeasuresResponse);
    } catch (error) {
      console.warn("[SonarQube] Failed to fetch batch measures:", error);
      // Continue with empty measures - projects will show without metrics
    }

    // Step 4: Combine project data with measures
    const projectsWithMetrics: ProjectWithMetrics[] = projectsResponse.components.map((project: SonarQubeProject) => {
      const measures = measuresByComponent[project.key];

      // Extract quality gate status from alert_status metric
      // alert_status is equivalent to the quality gate status (OK/WARN/ERROR/NONE)
      const qualityGateStatus = measures?.alert_status as "OK" | "WARN" | "ERROR" | "NONE" | undefined;

      return {
        ...project,
        measures: measures || undefined,
        qualityGateStatus,
      };
    });

    return {
      projects: projectsWithMetrics,
      paging: projectsResponse.paging,
    };
  });
