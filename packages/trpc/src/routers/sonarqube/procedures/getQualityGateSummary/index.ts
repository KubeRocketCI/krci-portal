import { QUALITY_GATE_STATUS } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createSonarQubeClient } from "../../../../clients/sonarqube/index.js";

const MAX_SONARQUBE_PROJECTS = 500;

/**
 * Get aggregated quality gate summary across all SonarQube projects
 *
 * Fetches all projects and their alert_status metric in bulk to compute
 * a namespace-wide quality gate pass/fail summary for dashboard widgets.
 *
 * @returns Summary with passed/warned/failed/total counts and pass rate
 */
export const getQualityGateSummaryProcedure = protectedProcedure.query(async () => {
  const client = createSonarQubeClient();

  const projectsResponse = await client.getProjects({ page: 1, pageSize: MAX_SONARQUBE_PROJECTS });

  if (projectsResponse.components.length === 0) {
    return { passed: 0, warned: 0, failed: 0, total: 0, passRate: null };
  }

  const projectKeys = projectsResponse.components.map((p) => p.key);

  let measuresByComponent: Record<string, Record<string, string>> = {};

  try {
    const batchResponse = await client.getBatchMeasures(projectKeys, ["alert_status"]);
    measuresByComponent = client.parseBatchMeasures(batchResponse);
  } catch (error) {
    console.warn("[SonarQube] Failed to fetch batch measures for quality gate summary:", error);
    return {
      passed: 0,
      warned: 0,
      failed: 0,
      total: projectsResponse.components.length,
      passRate: null,
    };
  }

  let passed = 0;
  let warned = 0;
  let failed = 0;

  for (const key of projectKeys) {
    const status = measuresByComponent[key]?.alert_status;
    if (status === QUALITY_GATE_STATUS.OK) passed++;
    else if (status === QUALITY_GATE_STATUS.WARN) warned++;
    else if (status === QUALITY_GATE_STATUS.ERROR) failed++;
  }

  const total = projectsResponse.components.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : null;

  return { passed, warned, failed, total, passRate };
});
