import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import { qualityGateStatusResponseSchema } from "@my-project/shared";

/**
 * Get quality gate details with all conditions
 *
 * Fetches the quality gate status including:
 * - Overall status (OK, WARN, ERROR, NONE)
 * - All quality gate conditions with thresholds
 * - Actual values vs expected thresholds
 * - Pass/fail status per condition
 *
 * @input projectKey - SonarQube project key
 * @returns Quality gate status with all conditions
 *
 * @example
 * const qgDetails = await trpc.sonarqube.getQualityGateDetails.query({
 *   projectKey: "my-service"
 * });
 */
export const getQualityGateDetailsProcedure = protectedProcedure
  .input(
    z.object({
      projectKey: z.string().describe("SonarQube project key"),
    })
  )
  .output(qualityGateStatusResponseSchema)
  .query(async ({ input }) => {
    const { projectKey } = input;
    const sonarqubeClient = createSonarQubeClient();

    try {
      const qgResponse = await sonarqubeClient.getQualityGateDetails(projectKey);
      console.info(`[SonarQube] Quality gate status for ${projectKey}: ${qgResponse.projectStatus.status}`);
      return qgResponse;
    } catch (error) {
      console.error(`[SonarQube] Failed to fetch quality gate for ${projectKey}:`, error);
      throw error;
    }
  });
