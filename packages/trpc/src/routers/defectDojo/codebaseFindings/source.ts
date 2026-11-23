import type { DefectDojoClient } from "../../../clients/defectDojo/index.js";

/** The reads of DefectDojo that the findings of a codebase need. */
export type CodebaseFindingsSource = Pick<DefectDojoClient, "listTests" | "getSeverityCounts" | "listFindings">;
