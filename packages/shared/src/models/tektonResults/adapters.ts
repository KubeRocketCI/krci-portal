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
import type { DecodedPipelineRun, DecodedTaskRun } from "./types.js";

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
  const annotations = decoded.metadata.annotations ?? {};

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
