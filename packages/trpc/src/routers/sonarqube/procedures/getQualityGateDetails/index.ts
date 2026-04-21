import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import { qualityGateStatusResponseSchema, withScopeMutuallyExclusive } from "@my-project/shared";
import { notFoundMessage } from "../../utils.js";

/**
 * Fetches the quality gate status (overall + per-condition) for a project.
 *
 * When `pullRequest` or `branch` is supplied, forwards the corresponding
 * scope param to `/api/qualitygates/project_status`. The two are mutually
 * exclusive at the SonarQube API layer.
 */
export const getQualityGateDetailsProcedure = protectedProcedure
  .input(
    withScopeMutuallyExclusive(
      z
        .object({
          projectKey: z.string().describe("SonarQube project key"),
          pullRequest: z.string().min(1).optional().describe("Optional SonarQube pull-request id"),
          branch: z.string().min(1).optional().describe("Optional SonarQube branch name"),
        })
        .strict()
    )
  )
  .output(qualityGateStatusResponseSchema)
  .query(async ({ input }) => {
    const { projectKey, pullRequest, branch } = input;
    const sonarqubeClient = createSonarQubeClient();

    try {
      const qgResponse = await sonarqubeClient.getQualityGateStatus(projectKey, { pullRequest, branch });
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
          message: notFoundMessage(projectKey, pullRequest, branch),
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
