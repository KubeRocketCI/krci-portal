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
import type { DecodedPipelineRun, DecodedTaskRun, TektonResult, TektonResultStatus } from "./types.js";
import { tektonResultAnnotations } from "./annotations.js";
import { pipelineRunLabels } from "../k8s/groups/Tekton/PipelineRun/labels.js";
import { RESULT_ANNOTATIONS_KEY } from "../k8s/groups/Tekton/PipelineRun/utils/resultAnnotations/index.js";
import { k8sPipelineRunConfig } from "../k8s/groups/Tekton/PipelineRun/constants.js";

/**
 * Normalize a decoded PipelineRun from Tekton Results to a K8s PipelineRun type.
 *
 * The decoded data has the same structure as the K8s CR. This adapter ensures:
 * - Required metadata fields have safe defaults (creationTimestamp, uid)
 * - Labels include the required `pipelineType` key
 * - Status conditions reason is lowercased to match the K8s enum
 */
export function normalizeHistoryPipelineRun(decoded: DecodedPipelineRun): PipelineRun {
  const labels = decoded.metadata.labels ?? {};
  const annotations = {
    ...decoded.metadata.annotations,
    [tektonResultAnnotations.historySource]: "true",
  };

  const conditions = decoded.status?.conditions?.map((c) => ({
    ...c,
    reason: c.reason?.toLowerCase(),
  }));

  // The decoded Tekton Results data is structurally identical to K8s PipelineRun CR.
  // We build the object with safe defaults for required fields and assert at the boundary.
  const normalized = {
    apiVersion: decoded.apiVersion,
    kind: decoded.kind,
    metadata: {
      name: decoded.metadata.name,
      namespace: decoded.metadata.namespace,
      uid: decoded.metadata.uid,
      creationTimestamp: decoded.metadata.creationTimestamp ?? decoded.status?.startTime ?? "",
      resourceVersion: decoded.metadata.resourceVersion,
      generation: decoded.metadata.generation,
      labels,
      annotations,
    },
    spec: {
      pipelineRef: decoded.spec.pipelineRef,
      // Inline pipeline spec — required for history rows where only spec (not status) retained task list
      pipelineSpec: decoded.spec.pipelineSpec,
      params: decoded.spec.params,
      workspaces: decoded.spec.workspaces,
      serviceAccountName: decoded.spec.serviceAccountName,
      timeout: decoded.spec.timeout,
    },
    status: decoded.status
      ? {
          startTime: decoded.status.startTime,
          completionTime: decoded.status.completionTime,
          conditions,
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
  const labels = decoded.metadata.labels ?? {};
  const annotations = decoded.metadata.annotations ?? {};

  const conditions = decoded.status?.conditions?.map((c) => ({
    ...c,
    reason: c.reason?.toLowerCase(),
  }));

  const normalized = {
    apiVersion: decoded.apiVersion,
    kind: decoded.kind,
    metadata: {
      name: decoded.metadata.name,
      namespace: decoded.metadata.namespace,
      uid: decoded.metadata.uid,
      creationTimestamp: decoded.metadata.creationTimestamp ?? decoded.status?.startTime ?? "",
      resourceVersion: decoded.metadata.resourceVersion,
      generation: decoded.metadata.generation,
      labels,
      annotations,
    },
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
          conditions,
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

// ---------------------------------------------------------------------------
// Result → PipelineRun normalizer (lightweight summary, no JSONB decode)
// ---------------------------------------------------------------------------

const RESULT_STATUS_MAP: Record<TektonResultStatus, { status: string; reason: string }> = {
  SUCCESS: { status: "true", reason: "succeeded" },
  FAILURE: { status: "false", reason: "failed" },
  TIMEOUT: { status: "false", reason: "pipelineruntimeout" },
  CANCELLED: { status: "false", reason: "cancelled" },
  UNKNOWN: { status: "unknown", reason: "running" },
};

function getResultAnnotation(result: TektonResult, key: string): string | undefined {
  const value = result.annotations?.[key];
  if (typeof value !== "string") return undefined;
  return value;
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

  const startTime = result.create_time;
  // summary.end_time is NULL for many results due to a Tekton Results watcher bug
  // (the watcher uses ConditionReady instead of status.completionTime).
  // Fallback to update_time: the Result is updated when the PipelineRun completes,
  // so update_time ≈ actual completion time for finished runs.
  const isCompleted = summaryStatus !== "UNKNOWN";
  const completionTime = result.summary?.end_time || (isCompleted ? result.update_time : undefined);

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
          reason: statusInfo.reason,
          lastTransitionTime: completionTime || startTime,
        },
      ],
    },
  };

  return normalized as unknown as PipelineRun;
}
