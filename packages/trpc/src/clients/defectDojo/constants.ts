import {
  DEFECTDOJO_LEVEL_SCAN_TYPES,
  DEFECTDOJO_MAX_PAGE_SIZE,
  type DefectDojoFindingState,
  type DefectDojoLevel,
} from "@my-project/shared";

export const DEFECTDOJO_SERVICE_NAME = "DefectDojo";

/** Product Type read when `DEFECTDOJO_PRODUCT_TYPE` is not set. */
export const DEFAULT_PRODUCT_TYPE = "KubeRocketCI";

/** Timeout of one request to DefectDojo. */
export const DEFECTDOJO_TIMEOUT_MS = 30_000;

/** DefectDojo sets no maximum page size; a findings page is capped here, at the cap the browser is held to. */
export const FINDINGS_MAX_PAGE_SIZE = DEFECTDOJO_MAX_PAGE_SIZE;

/** Rows per request when a list of products or tests is read completely. */
export const LIST_PAGE_SIZE = 500;

/** How long a looked-up id of a test type or of the Product Type is kept. */
export const ID_CACHE_TTL_MS = 10 * 60 * 1000;

export const ID_CACHE_MAX_ENTRIES = 100;

/** Severity names of DefectDojo, most severe first, its levels and scan types. The browser reads the same lists. */
export {
  DEFECTDOJO_LEVEL_SCAN_TYPES,
  DEFECTDOJO_SEVERITIES,
  type DefectDojoLevel,
  type DefectDojoScanType,
  type DefectDojoSeverity,
} from "@my-project/shared";

/** Level of a scan type, or `null` for a scan type of no level. */
export function levelOfScanType(scanType: string): DefectDojoLevel | null {
  for (const [level, scanTypes] of Object.entries(DEFECTDOJO_LEVEL_SCAN_TYPES)) {
    if ((scanTypes as readonly string[]).includes(scanType)) {
      return level as DefectDojoLevel;
    }
  }
  return null;
}

/** A findings list is asked for one state, or for `any`: the findings of every state, duplicates apart. */
export type DefectDojoFindingStateFilter = DefectDojoFindingState | "any";

/**
 * Query parameters that select each finding state. DefectDojo also marks a false positive and an out of scope
 * finding as mitigated, so Mitigated leaves both out and holds the fixed findings.
 */
export const FINDING_STATE_PARAMS = {
  active: { active: true },
  mitigated: { is_mitigated: true, false_p: false, out_of_scope: false },
  falsePositive: { false_p: true },
  outOfScope: { out_of_scope: true },
  riskAccepted: { risk_accepted: true },
} as const satisfies Record<DefectDojoFindingState, Record<string, boolean>>;
