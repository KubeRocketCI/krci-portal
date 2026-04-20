import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import { qualityGateStatusResponseSchema } from "@my-project/shared";

/**
 * Fetches the quality gate status (overall + per-condition) for a project.
 *
 * When `pullRequest` is supplied, forwards `&pullRequest=<id>` to
 * `/api/qualitygates/project_status`.
 */
export const getQualityGateDetailsProcedure = protectedProcedure
  .input(
    z
      .object({
        projectKey: z.string().describe("SonarQube project key"),
        pullRequest: z.string().optional().describe("Optional SonarQube pull-request id"),
      })
      .strict()
  )
  .output(qualityGateStatusResponseSchema)
  .query(async ({ input }) => {
    const { projectKey, pullRequest } = input;
    const sonarqubeClient = createSonarQubeClient();

    try {
      const qgResponse = await sonarqubeClient.getQualityGateStatus(projectKey, pullRequest);
      console.info(`[SonarQube] Quality gate status for ${projectKey}: ${qgResponse.projectStatus.status}`);
      return qgResponse;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error(`[SonarQube] Failed to fetch quality gate for ${projectKey}:`, error);

      if (error instanceof Error && /:\s*404\b/.test(error.message)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: pullRequest ? `pull request ${pullRequest} not found` : `project ${projectKey} not found`,
          cause: error,
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `SonarQube upstream failure for ${projectKey}`,
        cause: error,
      });
    }
  });
