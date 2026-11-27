import { NO_FINDING_COUNTS, type SeverityCounts } from "@my-project/shared";
import {
  dataOf,
  type DefectDojoClient,
  type DefectDojoFindingStateFilter,
  type DefectDojoScope,
} from "../../../clients/defectDojo/index.js";
import { mapWithConcurrency } from "../../../utils/mapWithConcurrency/index.js";
import { COUNT_CONCURRENCY } from "../codebaseFindings/compose.js";

/** The reads of DefectDojo that the Security overview needs, and what its cache is keyed by. */
export type SecurityOverviewSource = Pick<
  DefectDojoClient,
  "listProductsWithTagText" | "listTests" | "listFindings" | "getSeverityCounts" | "cacheScope"
>;

/** The findings of each scope by severity, `COUNT_CONCURRENCY` requests at a time; a scope without scan data has none. */
export function countEach(
  source: Pick<DefectDojoClient, "getSeverityCounts">,
  scopes: readonly DefectDojoScope[],
  options: { state: DefectDojoFindingStateFilter; testExists?: boolean }
): Promise<SeverityCounts[]> {
  return mapWithConcurrency(
    scopes,
    COUNT_CONCURRENCY,
    async (scope) => dataOf(await source.getSeverityCounts(scope, options))?.severity ?? NO_FINDING_COUNTS
  );
}
