import {
  getPipelineRunStatus,
  isPipelineRunPendingReason,
  pipelineLabels,
  pipelineRunLabels,
  pipelineRunPhase,
  pipelineRunReason,
  type Pipeline,
  type PipelineRun,
  type PipelineRunDraft,
} from "@my-project/shared";
import { type PipelineRunStartRow } from "../../schemas/pipelineRunStartRow.js";

/** Empty start row. Used in the dry-run path (no live resource exists yet). */
export const EMPTY_START_ROW: PipelineRunStartRow = {
  name: "",
  status: "",
  project: "",
  pr: "",
  author: "",
  type: "",
  started: "",
  duration: "",
};

/** Tekton PipelineRun param entry as supplied by the platform's CRD. */
export interface PipelineParam {
  name: string;
  value?: unknown;
}

/**
 * Merge user-supplied param overrides over Pipeline defaults.
 *
 * - Defaults appear first (one per name); user-supplied overrides replace
 *   their value in place.
 * - Names absent from defaults are added.
 * - Final output is sorted alphabetically by name so dry-run manifests are
 *   deterministic for diffs and snapshot tests.
 */
export function mergeParams(
  defaults: readonly PipelineParam[] | undefined,
  userParams: Readonly<Record<string, string>> | undefined
): PipelineParam[] {
  const overrides = userParams ?? {};
  const out: PipelineParam[] = [];
  const seen = new Set<string>();

  for (const def of defaults ?? []) {
    if (Object.hasOwn(overrides, def.name)) {
      out.push({ name: def.name, value: overrides[def.name] });
    } else {
      out.push({ name: def.name, value: def.value });
    }

    seen.add(def.name);
  }

  for (const [name, value] of Object.entries(overrides)) {
    if (!seen.has(name)) {
      out.push({ name, value });
    }
  }

  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Merge user-supplied labels over the draft's existing labels. User wins on
 * key collisions, which lets callers override TriggerTemplate-seeded label
 * values.
 */
export function mergeLabels(
  draftLabels: Readonly<Record<string, string | undefined>> | undefined,
  userLabels: Readonly<Record<string, string>> | undefined
): Record<string, string> {
  const out: Record<string, string> = {};

  for (const [k, v] of Object.entries(draftLabels ?? {})) {
    if (typeof v === "string") {
      out[k] = v;
    }
  }

  for (const [k, v] of Object.entries(userLabels ?? {})) {
    out[k] = v;
  }

  return out;
}

/** Kubernetes object names are capped at 63 chars; the apiserver appends 5 to `generateName`. */
const MAX_GENERATE_NAME_LENGTH = 63 - 5;

/** Cut `prefix` to the name budget, keeping its trailing dash when it has one. */
function fitGenerateName(prefix: string): string {
  if (prefix.length <= MAX_GENERATE_NAME_LENGTH) {
    return prefix;
  }

  return prefix.endsWith("-")
    ? `${prefix.slice(0, MAX_GENERATE_NAME_LENGTH - 1)}-`
    : prefix.slice(0, MAX_GENERATE_NAME_LENGTH);
}

/**
 * Clone of `draft` with `metadata.name` removed, `metadata.generateName` set
 * to `prefix` cut to the 58-char budget, and `metadata.namespace` pinned to
 * `namespace`. The input draft is not mutated.
 */
export function withGenerateName<T extends object>(draft: T, prefix: string, namespace: string): T {
  const cloned = structuredClone(draft) as Record<string, unknown>;

  const metadata = (cloned.metadata ?? {}) as Record<string, unknown>;
  delete metadata.name;
  metadata.generateName = fitGenerateName(prefix);
  metadata.namespace = namespace;
  cloned.metadata = metadata;

  return cloned as T;
}

/**
 * Replace `spec.params` with `userParams` merged over the draft's own
 * (user wins, sorted). Mutates and returns `draft`.
 */
export function mergeDraftParams<T extends object>(
  draft: T,
  userParams: Readonly<Record<string, string>> | undefined
): T {
  const target = draft as Record<string, unknown>;
  const spec = (target.spec ?? {}) as Record<string, unknown>;
  const defaults = Array.isArray(spec.params) ? (spec.params as PipelineParam[]) : undefined;
  spec.params = mergeParams(defaults, userParams);
  target.spec = spec;

  return draft;
}

/**
 * Clone the helper-built draft and apply the start procedure's pre-create
 * mutations:
 *   - Replace `metadata.name` with `metadata.generateName` so the apiserver
 *     assigns the suffix; the response carries the populated `metadata.name`.
 *   - Pin `metadata.namespace` to the user-requested namespace.
 *   - Merge user labels over draft labels (user wins).
 *   - Merge user params over Pipeline defaults (user wins, sorted).
 *
 * The function is pure: the input draft is not mutated.
 */
export function prepareStartDraft(
  baseDraft: PipelineRunDraft,
  pipelineName: string,
  namespace: string,
  userParams: Readonly<Record<string, string>> | undefined,
  userLabels: Readonly<Record<string, string>> | undefined
): PipelineRunDraft {
  const cloned = withGenerateName(baseDraft, `${pipelineName}-run-`, namespace) as unknown as Record<string, unknown>;

  const metadata = cloned.metadata as Record<string, unknown>;
  metadata.labels = mergeLabels(metadata.labels as Record<string, string | undefined> | undefined, userLabels);

  return mergeDraftParams(cloned, userParams) as unknown as PipelineRunDraft;
}

/** Project a created PipelineRun into the start-procedure row shape. */
export function projectPipelineRunRow(pr: PipelineRun | undefined | null): PipelineRunStartRow {
  if (!pr) {
    return { ...EMPTY_START_ROW };
  }

  const labels = pr.metadata?.labels ?? {};

  return {
    name: pr.metadata?.name ?? "",
    status: projectStatus(pr),
    project: labels[pipelineRunLabels.codebase] ?? "",
    pr: labels[pipelineRunLabels.changeNumber] ?? "",
    author: labels[pipelineRunLabels.gitAuthor] ?? "",
    type: labels[pipelineRunLabels.pipelineType] ?? "",
    started: pr.status?.startTime ?? pr.metadata?.creationTimestamp ?? "",
    duration: deriveDuration(pr.status?.startTime, pr.status?.completionTime),
  };
}

/**
 * Map `getPipelineRunStatus().phase` to the row's wire `status` string.
 * This row is a public OpenAPI contract (`POST /v1/pipelineruns/start`);
 * these strings must not change.
 *
 * A live run with status Unknown and no reason maps to "Pending". The
 * controller's `MarkRunning` always attaches a reason, so this case does
 * not occur in practice.
 */
function projectStatus(pr: PipelineRun): string {
  const { phase, reason } = getPipelineRunStatus(pr);

  switch (phase) {
    case pipelineRunPhase.succeeded:
      return "Succeeded";
    case pipelineRunPhase.failed:
      return reason === pipelineRunReason.pipelineruntimeout ? "Timeout" : "Failed";
    case pipelineRunPhase.cancelled:
    case pipelineRunPhase.cancelling:
      return "Cancelled";
    case pipelineRunPhase["in-progress"]:
      return reason === undefined || isPipelineRunPendingReason(reason) ? "Pending" : "Running";
    case pipelineRunPhase.unknown:
      return "Pending";
    default: {
      const _exhaustiveCheck: never = phase;
      throw new Error(`Unhandled PipelineRun phase: ${_exhaustiveCheck as string}`);
    }
  }
}

/** Compute "Xm Ys" style duration. Empty when start or completion is missing. */
export function deriveDuration(startTime: string | undefined, completionTime: string | undefined): string {
  if (!startTime || !completionTime) {
    return "";
  }

  const start = Date.parse(startTime);
  const end = Date.parse(completionTime);

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return "";
  }

  const totalSec = Math.round((end - start) / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;

  return m > 0 ? `${m}m${s}s` : `${s}s`;
}

/**
 * Returns the TriggerTemplate label value if the Pipeline carries one,
 * undefined otherwise. Empty strings are treated as absent.
 */
export function getTriggerTemplateLabel(pipeline: Pipeline): string | undefined {
  const value = pipeline.metadata?.labels?.[pipelineLabels.triggerTemplate];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
