import type { DefectDojoClient } from "../../../clients/defectDojo/index.js";

export type EnvironmentSummarySource = Pick<DefectDojoClient, "listTests" | "getSeverityCounts" | "listFindings">;
