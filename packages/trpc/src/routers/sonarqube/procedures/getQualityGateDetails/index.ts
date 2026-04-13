import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import { qualityGateStatusResponseSchema } from "@my-project/shared";

/**
 * Fetches the quality gate status (overall + per-condition) for a project.
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
      const qgResponse = await sonarqubeClient.getQualityGateStatus(projectKey);
      console.info(`[SonarQube] Quality gate status for ${projectKey}: ${qgResponse.projectStatus.status}`);
      return qgResponse;
    } catch (error) {
      console.error(`[SonarQube] Failed to fetch quality gate for ${projectKey}:`, error);
      throw error;
    }
  });
