/**
 * Tekton Results → K8s Type Adapters
 *
 * Pure functions that normalize decoded Tekton Results data to K8s-compatible types.
 * Used by the unified pipeline view to render history data with live-view components.
 *
 * The decoded data from Tekton Results IS structurally compatible with K8s types
 * (confirmed via real API responses). These adapters ensure safe defaults for
 * required fields and use type assertions localized to this module.
 */

import type { PipelineRun } from "../k8s/groups/Tekton/PipelineRun/types.js";
import type { TaskRun } from "../k8s/groups/Tekton/TaskRun/types.js";
import type { CustomRun } from "../k8s/groups/Tekton/CustomRun/types.js";
import type {
  DecodedCondition,
  DecodedCustomRun,
  DecodedPipelineRun,
  DecodedRecordMetadata,
  DecodedTaskRun,
  TektonResult,
  TektonResultStatus,
} from "./types.js";
import { tektonResultAnnotations } from "./annotations.js";
import { pipelineRunLabels } from "../k8s/groups/Tekton/PipelineRun/labels.js";
import { RESULT_ANNOTATIONS_KEY } from "../k8s/groups/Tekton/PipelineRun/utils/resultAnnotations/index.js";
import {
  k8sPipelineRunConfig,
  pipelineRunReason,
  pipelineRunStatus,
} from "../k8s/groups/Tekton/PipelineRun/constants.js";

/** K8s-shaped metadata for an archived record. Stamped with the history annotation. */
function normalizeHistoryMetadata(metadata: DecodedRecordMetadata, startTime: string | undefined) {
  return {
    name: metadata.name,
    namespace: metadata.namespace,
    uid: metadata.uid,
    creationTimestamp: metadata.creationTimestamp ?? startTime ?? "",
    resourceVersion: metadata.resourceVersion,
    generation: metadata.generation,
    labels: metadata.labels ?? {},
    annotations: {
      ...metadata.annotations,
      [tektonResultAnnotations.historySource]: "true",
    },
  };
}

/** Condition reasons lowercased to match the shared enums. */
function normalizeHistoryConditions(conditions: DecodedCondition[] | undefined) {
  return conditions?.map((c) => ({ ...c, reason: c.reason?.toLowerCase() }));
}

/** Archived PipelineRun as a K8s PipelineRun. The decoded shape is structurally identical; asserted at the boundary. */
export function normalizeHistoryPipelineRun(decoded: DecodedPipelineRun): PipelineRun {
  const normalized = {
    apiVersion: decoded.apiVersion,
    kind: decoded.kind,
    metadata: normalizeHistoryMetadata(decoded.metadata, decoded.status?.startTime),
    spec: {
      pipelineRef: decoded.spec.pipelineRef,
      // Inline pipeline spec — required for history rows where only spec (not status) retained task list
      pipelineSpec: decoded.spec.pipelineSpec,
      params: decoded.spec.params,
      workspaces: decoded.spec.workspaces,
      serviceAccountName: decoded.spec.serviceAccountName,
      podTemplate: decoded.spec.podTemplate,
      taskRunTemplate: decoded.spec.taskRunTemplate,
      taskRunSpecs: decoded.spec.taskRunSpecs,
      timeout: decoded.spec.timeout,
      timeouts: decoded.spec.timeouts,
    },
    status: decoded.status
      ? {
          startTime: decoded.status.startTime,
          completionTime: decoded.status.completionTime,
          conditions: normalizeHistoryConditions(decoded.status.conditions),
          pipelineSpec: decoded.status.pipelineSpec,
          childReferences: decoded.status.childReferences,
          results: decoded.status.results,
        }
      : undefined,
  };

  return normalized as unknown as PipelineRun;
}

/**
 * Normalize decoded TaskRun records from Tekton Results to K8s TaskRun types.
 *
 * Each decoded TaskRun contains full status (podName, steps, conditions, timing).
 * Labels include required keys: pipeline, pipelineType, parentPipelineRun, pipelineTask.
 */
export function normalizeHistoryTaskRuns(decodedTaskRuns: DecodedTaskRun[]): TaskRun[] {
  return decodedTaskRuns.map(normalizeHistoryTaskRun);
}

/**
 * Normalize a single decoded TaskRun from Tekton Results to a K8s TaskRun type.
 */
export function normalizeHistoryTaskRun(decoded: DecodedTaskRun): TaskRun {
  const normalized = {
    apiVersion: decoded.apiVersion,
    kind: decoded.kind,
    metadata: normalizeHistoryMetadata(decoded.metadata, decoded.status?.startTime),
    spec: {
      params: decoded.spec.params,
      taskRef: decoded.spec.taskRef,
      serviceAccountName: decoded.spec.serviceAccountName,
      timeout: decoded.spec.timeout,
      workspaces: decoded.spec.workspaces,
    },
    status: decoded.status
      ? {
          podName: decoded.status.podName,
          conditions: normalizeHistoryConditions(decoded.status.conditions),
          steps: decoded.status.steps,
          startTime: decoded.status.startTime,
          completionTime: decoded.status.completionTime,
          taskResults: decoded.status.taskResults,
          results: decoded.status.results,
          taskSpec: decoded.status.taskSpec,
          annotations: decoded.status.annotations,
          spanContext: decoded.status.spanContext,
          sidecars: decoded.status.sidecars,
        }
      : undefined,
  };

  return normalized as unknown as TaskRun;
}

/** Archived CustomRuns as K8s CustomRuns. */
export function normalizeHistoryCustomRuns(decodedCustomRuns: DecodedCustomRun[]): CustomRun[] {
  return decodedCustomRuns.map(normalizeHistoryCustomRun);
}

/** Archived CustomRun as a K8s CustomRun. Stamped with the history annotation like TaskRuns. */
export function normalizeHistoryCustomRun(decoded: DecodedCustomRun): CustomRun {
  const normalized = {
    apiVersion: decoded.apiVersion,
    kind: decoded.kind,
    metadata: normalizeHistoryMetadata(decoded.metadata, decoded.status?.startTime),
    spec: {
      customRef: decoded.spec.customRef,
      params: decoded.spec.params,
    },
    status: decoded.status
      ? {
          conditions: normalizeHistoryConditions(decoded.status.conditions),
          startTime: decoded.status.startTime,
          completionTime: decoded.status.completionTime,
        }
      : undefined,
  };

  return normalized as unknown as CustomRun;
}

// ---------------------------------------------------------------------------
// Result → PipelineRun normalizer (lightweight summary, no JSONB decode)
// ---------------------------------------------------------------------------

// A Result in the `results` table is an ARCHIVED run — terminal by definition:
// the unified list dedupes any live run out (live wins), so a Result that reaches
// the UI is never actually running. When the Tekton Results watcher failed to
// finalize `summary.status` (left UNKNOWN), the true SUCCESS/FAILURE lives only in
// the heavyweight record blob (surfaced on the detail page). For the lightweight
// list we render it as a neutral, terminal "Unknown" — never an active "Running"
// spinner. getPipelineRunStatus classifies any run stamped with the historySource
// annotation as `unknown` when its condition is Unknown, regardless of reason.
const RESULT_STATUS_MAP: Record<TektonResultStatus, { status: string; reason?: string }> = {
  SUCCESS: { status: pipelineRunStatus.true, reason: pipelineRunReason.succeeded },
  FAILURE: { status: pipelineRunStatus.false, reason: pipelineRunReason.failed },
  TIMEOUT: { status: pipelineRunStatus.false, reason: pipelineRunReason.pipelineruntimeout },
  CANCELLED: { status: pipelineRunStatus.false, reason: pipelineRunReason.cancelled },
  UNKNOWN: { status: pipelineRunStatus.unknown },
};

function getResultAnnotation(result: TektonResult, key: string): string | undefined {
  const value = result.annotations?.[key];
  if (typeof value !== "string") return undefined;
  return value;
}

function toEpochMs(timestamp: string | undefined): number | undefined {
  if (!timestamp) return undefined;
  const ms = Date.parse(timestamp);
  return Number.isNaN(ms) ? undefined : ms;
}

/**
 * Tekton Results < v0.20.0 derived RecordSummary timestamps from Knative conditions,
 * leaving `start_time` NULL on every row (`ConditionReady` is never set on batch
 * resources) and `end_time` NULL on failed/timed-out/cancelled ones (`ConditionSucceeded`
 * was skipped while False) — hence the per-field, rather than all-or-nothing, fallback.
 * tektoncd/results#1285 fixed the write path in v0.20.0 but does not backfill, so both
 * shapes coexist until the pre-upgrade rows age out of the retention window.
 *
 * `create_time`/`update_time` are server-populated and never NULL, so the fallback always
 * yields a bounded duration instead of one that grows forever — which matters most for
 * rows whose `summary.status` the watcher also left UNKNOWN.
 */
function resolveResultTimes(result: TektonResult): { startTime: string; completionTime: string } {
  const startTime = result.summary?.start_time || result.create_time;
  const completionTime = result.summary?.end_time || result.update_time;

  const startMs = toEpochMs(startTime);
  const completionMs = toEpochMs(completionTime);

  // Mixing a summary timestamp with a row timestamp can invert the interval: a run
  // archived after it finished has `create_time` > `end_time`, rendering a negative
  // duration. The row pair is written in order, so it is always self-consistent.
  if (startMs !== undefined && completionMs !== undefined && completionMs < startMs) {
    return { startTime: result.create_time, completionTime: result.update_time };
  }

  return { startTime, completionTime };
}

/**
 * Normalize a Tekton Result (from the `results` table) to a K8s PipelineRun shape.
 *
 * Unlike `normalizeHistoryPipelineRun` which decodes full JSONB PipelineRun blobs,
 * this function maps the lightweight Result annotations and summary fields to
 * the minimum PipelineRun shape needed for the list table.
 *
 * The resulting PipelineRun has no `status.results`, `status.childReferences`,
 * `spec.pipelineSpec`, or other heavyweight fields — those are only needed on
 * the detail page which still uses the full record endpoint.
 */
export function normalizeResultToPipelineRun(result: TektonResult, namespace: string): PipelineRun {
  const name = getResultAnnotation(result, tektonResultAnnotations.objectMetadataName) || result.uid;
  const pipelineName = getResultAnnotation(result, tektonResultAnnotations.pipeline);
  const codebase = getResultAnnotation(result, tektonResultAnnotations.codebase);
  const pipelineType = getResultAnnotation(result, tektonResultAnnotations.pipelineType);

  const summaryStatus = result.summary?.status || "UNKNOWN";
  const statusInfo = RESULT_STATUS_MAP[summaryStatus] || RESULT_STATUS_MAP.UNKNOWN;

  const { startTime, completionTime } = resolveResultTimes(result);

  const resultAnnotations: Record<string, string> = {};
  const annotationKeys = [
    tektonResultAnnotations.gitBranch,
    tektonResultAnnotations.gitAuthor,
    tektonResultAnnotations.gitAvatar,
    tektonResultAnnotations.gitChangeNumber,
    tektonResultAnnotations.gitChangeUrl,
  ] as const;

  for (const key of annotationKeys) {
    const val = getResultAnnotation(result, key);
    if (val) {
      resultAnnotations[key] = val;
    }
  }

  const labels: Record<string, string> = {};
  if (codebase) labels[pipelineRunLabels.codebase] = codebase;
  if (pipelineType) labels[pipelineRunLabels.pipelineType] = pipelineType;

  const normalized = {
    apiVersion: k8sPipelineRunConfig.apiVersion,
    kind: k8sPipelineRunConfig.kind,
    metadata: {
      name,
      namespace,
      uid: result.uid,
      creationTimestamp: result.create_time,
      labels,
      annotations: {
        [tektonResultAnnotations.historySource]: "true",
        ...(Object.keys(resultAnnotations).length > 0 && {
          [RESULT_ANNOTATIONS_KEY]: JSON.stringify(resultAnnotations),
        }),
      },
    },
    spec: {
      pipelineRef: pipelineName ? { name: pipelineName } : undefined,
    },
    status: {
      startTime,
      completionTime,
      conditions: [
        {
          type: "Succeeded",
          status: statusInfo.status,
          ...(statusInfo.reason ? { reason: statusInfo.reason } : {}),
          lastTransitionTime: completionTime || startTime,
        },
      ],
    },
  };

  return normalized as unknown as PipelineRun;
}
