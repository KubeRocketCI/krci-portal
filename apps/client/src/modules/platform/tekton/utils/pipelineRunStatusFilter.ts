import { pipelineRunPhase, PipelineRunPhase } from "@my-project/shared";
import { FilterTypeWithOptionAll } from "@/k8s/types";
import { buildSummaryStatusClause } from "./celFilters";

/** `cancelling` is folded into the `cancelled` option; `unknown` never appears in the UI. */
export const nonSelectableStatusPhases = ["cancelling", "unknown"] as const satisfies readonly PipelineRunPhase[];

export type SelectableStatusPhase = Exclude<PipelineRunPhase, (typeof nonSelectableStatusPhases)[number]>;

export type PipelineRunStatusFilterValue = FilterTypeWithOptionAll<SelectableStatusPhase>;

const validStatusFilterValues: ReadonlySet<PipelineRunStatusFilterValue> = new Set<PipelineRunStatusFilterValue>([
  "all",
  ...Object.values(pipelineRunPhase).filter(
    (phase): phase is SelectableStatusPhase => !(nonSelectableStatusPhases as readonly string[]).includes(phase)
  ),
]);

// Pre-phase URL status values, still live in old bookmarks/links.
const legacyStatusUrlValues: Record<string, PipelineRunStatusFilterValue> = {
  true: pipelineRunPhase.succeeded,
  false: pipelineRunPhase.failed,
  unknown: pipelineRunPhase["in-progress"],
};

/**
 * Normalizes a raw `status` value (from the URL, a bookmark, or a stale
 * caller) into the closed `PipelineRunStatusFilterValue` type.
 * `undefined` becomes `all`. Legacy values `true`/`false`/`unknown` map to
 * `succeeded`/`failed`/`in-progress`. Anything else outside the option list
 * falls back to `all`.
 */
export function normalizePipelineRunStatusFilterValue(raw: string | undefined): PipelineRunStatusFilterValue {
  if (raw === undefined) return "all";
  const mapped = legacyStatusUrlValues[raw] ?? raw;
  return validStatusFilterValues.has(mapped as PipelineRunStatusFilterValue)
    ? (mapped as PipelineRunStatusFilterValue)
    : "all";
}

/**
 * Maps PipelineRun phases to Tekton Results proto enum integers.
 * Proto RecordSummary.Status: UNKNOWN=0, SUCCESS=1, FAILURE=2, TIMEOUT=3, CANCELLED=4.
 */
const RESULT_STATUS_INTS = {
  succeeded: [1],
  failed: [2, 3],
  cancelled: [4],
} as const satisfies Record<string, readonly number[]>;

/** Resolution of a `PipelineRunStatusFilterValue` into the live and history query rules it implies. */
export interface PipelineRunStatusFilterResolution {
  /** Phases a live (watched) PipelineRun must have. `undefined` means no restriction. */
  livePhases: ReadonlySet<PipelineRunPhase> | undefined;
  /** CEL clause on `summary.status` for the Tekton Results history query. `undefined` means no restriction. */
  historyFilter: string | undefined;
  /** Whether the history query should run at all for this value. */
  historyEnabled: boolean;
}

function resolve(value: PipelineRunStatusFilterValue): PipelineRunStatusFilterResolution {
  switch (value) {
    case "all":
      return { livePhases: undefined, historyFilter: undefined, historyEnabled: true };

    case "in-progress":
      // Tekton Results holds only archived runs, so history can never contribute
      // one; an archived run with an unfinalized summary would render as running.
      return {
        livePhases: new Set([pipelineRunPhase["in-progress"]]),
        historyFilter: undefined,
        historyEnabled: false,
      };

    case "succeeded":
      return {
        livePhases: new Set([pipelineRunPhase.succeeded]),
        historyFilter: buildSummaryStatusClause(RESULT_STATUS_INTS.succeeded),
        historyEnabled: true,
      };

    case "failed":
      return {
        livePhases: new Set([pipelineRunPhase.failed]),
        historyFilter: buildSummaryStatusClause(RESULT_STATUS_INTS.failed),
        historyEnabled: true,
      };

    case "cancelled":
      // One bucket in the UI for both the terminal phase (False + a cancel
      // reason) and the live wind-down phase (Unknown + a cancel reason).
      return {
        livePhases: new Set([pipelineRunPhase.cancelled, pipelineRunPhase.cancelling]),
        historyFilter: buildSummaryStatusClause(RESULT_STATUS_INTS.cancelled),
        historyEnabled: true,
      };

    default: {
      const _exhaustiveCheck: never = value;
      throw new Error(`Unhandled PipelineRun status filter value: ${_exhaustiveCheck as string}`);
    }
  }
}

/** Every `PipelineRunStatusFilterValue` resolved once at module load. */
const RESOLUTIONS: Record<PipelineRunStatusFilterValue, PipelineRunStatusFilterResolution> = Object.fromEntries(
  [...validStatusFilterValues].map((value) => [value, resolve(value)])
) as Record<PipelineRunStatusFilterValue, PipelineRunStatusFilterResolution>;

/**
 * Single source of truth for what a PipelineRun status filter value means:
 * which live phases it selects, what CEL clause it applies to Tekton Results
 * history, and whether history should be queried at all.
 */
export const resolvePipelineRunStatusFilter = (
  value: PipelineRunStatusFilterValue
): PipelineRunStatusFilterResolution => RESOLUTIONS[value];
