import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";
import {
  QUALITY_GATE_STATUS,
  QualityGateStatusValue,
  SONARQUBE_METRIC_KEYS,
  projectWithMetricsSchema,
} from "@my-project/shared";

/**
 * Get a single SonarQube project (via `/api/components/show`) with its measures.
 * Throws NOT_FOUND when the component does not exist.
 *
 * When `pullRequest` is supplied, forwards `&pullRequest=<id>` to both
 * `/api/components/show` and `/api/measures/component`.
 */
export const getProjectProcedure = protectedProcedure
  .input(
    z
      .object({
        componentKey: z.string().describe("SonarQube component/project key"),
        pullRequest: z.string().optional().describe("Optional SonarQube pull-request id"),
      })
      .strict()
  )
  .output(projectWithMetricsSchema)
  .query(async ({ input }) => {
    const { componentKey, pullRequest } = input;
    const sonarqubeClient = createSonarQubeClient();

    try {
      // Fetch component and measures in parallel — measures failures are tolerated.
      const [componentResponse, measuresResponse] = await Promise.all([
        sonarqubeClient.getComponent(componentKey, pullRequest),
        sonarqubeClient.getMeasures(componentKey, SONARQUBE_METRIC_KEYS, pullRequest).catch((error) => {
          console.warn(`[SonarQube] Failed to fetch measures for ${componentKey}:`, error);
          return null;
        }),
      ]);

      if (!componentResponse) {
        console.warn(`[SonarQube] Component not found: ${componentKey}`);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: pullRequest ? `pull request ${pullRequest} not found` : `project ${componentKey} not found`,
        });
      }

      const measures = measuresResponse ? sonarqubeClient.parseMeasures(measuresResponse) : {};
      const { alert_status } = measures;
      const qualityGateStatus = isQualityGateStatusValue(alert_status) ? alert_status : undefined;

      const { analysisDate, ...component } = componentResponse.component;

      return {
        ...component,
        // /api/components/show returns analysisDate; normalize to lastAnalysisDate for UI
        lastAnalysisDate: component.lastAnalysisDate ?? analysisDate,
        measures,
        qualityGateStatus,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error(`[SonarQube] Failed to fetch project: ${componentKey}`, error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `SonarQube upstream failure for ${componentKey}`,
        cause: error,
      });
    }
  });

const QUALITY_GATE_STATUS_VALUES = new Set<string>(Object.values(QUALITY_GATE_STATUS));

const isQualityGateStatusValue = (value: string | undefined): value is QualityGateStatusValue =>
  value !== undefined && QUALITY_GATE_STATUS_VALUES.has(value);
