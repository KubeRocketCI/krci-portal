import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import {
  sonarqubeProjectsQueryParamsSchema,
  ProjectWithMetrics,
  SonarQubeProject,
  SONARQUBE_METRIC_KEYS,
} from "@my-project/shared";

/**
 * Get all SonarQube projects with their metrics and quality gate status
 *
 * This procedure uses a batch approach to minimize API calls:
 * 1. Fetches the list of projects from SonarQube (1 API call)
 * 2. Fetches measures for ALL projects in a single batch request (1 API call)
 * 3. Extracts quality gate status from alert_status metric (no additional API call)
 * 4. Returns combined data for display in the SAST overview
 */
export const getProjects = protectedProcedure.input(sonarqubeProjectsQueryParamsSchema).query(async ({ input }) => {
  const client = createSonarQubeClient();

  // Step 1: Fetch projects list (1 API call)
  const projectsResponse = await client.getProjects(input);

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
