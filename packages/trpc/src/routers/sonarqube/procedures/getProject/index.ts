import { z } from "zod";
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
 * Returns null when the component does not exist, so the UI can render an empty state.
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
      // Fetch component and measures in parallel — measures failures are tolerated.
      const [componentResponse, measuresResponse] = await Promise.all([
        sonarqubeClient.getComponent(componentKey),
        sonarqubeClient.getMeasures(componentKey, SONARQUBE_METRIC_KEYS).catch((error) => {
          console.warn(`[SonarQube] Failed to fetch measures for ${componentKey}:`, error);
          return null;
        }),
      ]);

      if (!componentResponse) {
        console.warn(`[SonarQube] Component not found: ${componentKey}`);
        return null;
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
      console.error(`[SonarQube] Failed to fetch project: ${componentKey}`, error);
      throw error;
    }
  });

const QUALITY_GATE_STATUS_VALUES = new Set<string>(Object.values(QUALITY_GATE_STATUS));

const isQualityGateStatusValue = (value: string | undefined): value is QualityGateStatusValue =>
  value !== undefined && QUALITY_GATE_STATUS_VALUES.has(value);
