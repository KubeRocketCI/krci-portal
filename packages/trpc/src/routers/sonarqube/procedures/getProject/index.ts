import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import { SONARQUBE_METRIC_KEYS, projectWithMetricsSchema } from "@my-project/shared";

/**
 * Get a single SonarQube project with full metadata and metrics
 *
 * This procedure fetches complete project information by making two targeted API calls:
 * 1. Search for the specific project to get metadata (name, visibility, lastAnalysisDate, etc.)
 * 2. Fetch all metrics for that project
 *
 * Returns null if the component is not found, allowing the UI to show
 * a helpful empty state with configuration instructions.
 *
 * @input componentKey - SonarQube component/project key
 * @returns Full project with metadata and measures, or null if not found
 *
 * @example
 * const project = await trpc.sonarqube.getProject.query({
 *   componentKey: "my-service"
 * });
 * if (!project) {
 *   console.log("Component not found in SonarQube");
 * }
 */
export const getProjectProcedure = protectedProcedure
  .input(
    z.object({
      componentKey: z.string().describe("SonarQube component/project key"),
    })
  )
  .output(projectWithMetricsSchema.nullable())
  .query(async ({ input }) => {
    const { componentKey } = input;
    const sonarqubeClient = createSonarQubeClient();

    try {
      // Step 1: Fetch the specific project by exact key to get full metadata
      const projectsResponse = await sonarqubeClient.getProjects({
        page: 1,
        pageSize: 1,
        projectKeys: componentKey, // Exact key matching via 'projects' API param
      });

      // Check if project was found
      const project = projectsResponse.components[0];
      if (!project) {
        console.warn(`[SonarQube] Component not found: ${componentKey}`);
        return null;
      }

      // Step 2: Fetch measures for the project
      let measures: Record<string, string> = {};
      try {
        const measuresResponse = await sonarqubeClient.getMeasures(componentKey, SONARQUBE_METRIC_KEYS);
        measures = sonarqubeClient.parseMeasures(measuresResponse);
      } catch (error) {
        console.warn(`[SonarQube] Failed to fetch measures for ${componentKey}:`, error);
        // Continue with empty measures - project will show without metrics
      }

      // Step 3: Extract quality gate status from measures (if available)
      const qualityGateStatus =
        measures.alert_status && ["OK", "WARN", "ERROR", "NONE"].includes(measures.alert_status)
          ? (measures.alert_status as "OK" | "WARN" | "ERROR" | "NONE")
          : undefined;

      console.info(`[SonarQube] Found project: ${componentKey}`);

      return {
        ...project,
        measures,
        qualityGateStatus,
      };
    } catch (error) {
      // SonarQube returns 404 if component doesn't exist
      // Return null to trigger empty state UI instead of error state
      if (error instanceof Error && error.message.includes("404")) {
        console.warn(`[SonarQube] Component not found: ${componentKey}`);
        return null;
      }

      // Re-throw other errors (network issues, 500s, authentication, etc.)
      console.error(`[SonarQube] Failed to fetch project: ${componentKey}`, error);
      throw error;
    }
  });
