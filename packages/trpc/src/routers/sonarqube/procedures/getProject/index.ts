import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import { SONARQUBE_METRIC_KEYS } from "@my-project/shared";

/**
 * Get a single SonarQube project with metrics by component key
 *
 * This procedure fetches all metrics for a specific SonarQube project/component.
 * Returns null if the component is not found (404), allowing the UI to show
 * a helpful empty state with configuration instructions.
 *
 * @input componentKey - SonarQube component/project key
 * @returns Project key with normalized measures, or null if not found
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
  .query(async ({ input }) => {
    const { componentKey } = input;
    const sonarqubeClient = createSonarQubeClient();

    try {
      // Fetch measures for the component using existing client method
      const measuresResponse = await sonarqubeClient.getMeasures(componentKey, SONARQUBE_METRIC_KEYS);

      // Parse measures into normalized format using existing parser
      const measures = sonarqubeClient.parseMeasures(measuresResponse);

      console.info(`[SonarQube] Found project: ${componentKey}`);

      return {
        key: componentKey,
        measures,
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
