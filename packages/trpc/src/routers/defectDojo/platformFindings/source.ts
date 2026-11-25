import type { DefectDojoClient } from "../../../clients/defectDojo/index.js";

export type PlatformFindingsSource = Pick<DefectDojoClient, "listProductsWithTagText" | "listFindings" | "hasTests">;
