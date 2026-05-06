import {
  pipelineLabels,
  pipelineRunLabels,
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
  const cloned = structuredClone(baseDraft) as unknown as Record<string, unknown>;

  const metadata = (cloned.metadata ?? {}) as Record<string, unknown>;
  delete metadata.name;
  metadata.generateName = `${pipelineName}-run-`;
  metadata.namespace = namespace;
  metadata.labels = mergeLabels(metadata.labels as Record<string, string | undefined> | undefined, userLabels);
  cloned.metadata = metadata;

  const spec = (cloned.spec ?? {}) as Record<string, unknown>;
  const defaults = Array.isArray(spec.params) ? (spec.params as PipelineParam[]) : undefined;
  spec.params = mergeParams(defaults, userParams);
  cloned.spec = spec;

  return cloned as unknown as PipelineRunDraft;
}

/** Project a created PipelineRun into the start-procedure row shape. */
export function projectPipelineRunRow(pr: PipelineRun | undefined | null): PipelineRunStartRow {
  if (!pr) {
    return { ...EMPTY_START_ROW };
  }

  const labels = pr.metadata?.labels ?? {};
  const succeededCondition = pr.status?.conditions?.find((c) => c.type === "Succeeded");

  return {
    name: pr.metadata?.name ?? "",
    status: deriveStatus(succeededCondition),
    project: labels[pipelineRunLabels.codebase] ?? "",
    pr: labels[pipelineRunLabels.changeNumber] ?? "",
    author: labels[pipelineRunLabels.gitAuthor] ?? "",
    type: labels[pipelineRunLabels.pipelineType] ?? "",
    started: pr.status?.startTime ?? pr.metadata?.creationTimestamp ?? "",
    duration: deriveDuration(pr.status?.startTime, pr.status?.completionTime),
  };
}

interface PipelineRunCondition {
  type?: string;
  status?: string;
  reason?: string;
}

/**
 * Derive a user-facing status string from a PipelineRun condition.
 * Returns "Pending" when no condition is present (a freshly-created run
 * lacks status until the controller schedules it).
 */
export function deriveStatus(c: PipelineRunCondition | undefined): string {
  if (!c) {
    return "Pending";
  }

  switch (c.status) {
    case "True":
      return "Succeeded";
    case "False":
      switch (c.reason) {
        case "Cancelled":
        case "PipelineRunCancelled":
          return "Cancelled";
        case "PipelineRunTimeout":
          return "Timeout";
        default:
          return "Failed";
      }
    default:
      return "Running";
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
