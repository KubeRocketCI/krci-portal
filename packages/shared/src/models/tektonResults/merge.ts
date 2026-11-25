import type { PipelineRun } from "../k8s/groups/Tekton/PipelineRun/types.js";

function pipelineRunTimeMs(pr: PipelineRun): number {
  const time = pr.metadata.creationTimestamp || pr.status?.startTime || "";
  return new Date(time).getTime() || 0;
}

/**
 * `history` must be in the live shape (`normalizeResultToPipelineRun`).
 * Both lists must be from one namespace: a live run replaces a history run with the same name.
 * Duplicate names within `history` are kept.
 * Sort: newest first by `creationTimestamp`, else `status.startTime` when `creationTimestamp` is empty.
 * A run whose chosen time does not parse goes last. Equal times keep input order, live before history.
 */
export function mergeLiveAndHistoryPipelineRuns(live: PipelineRun[], history: PipelineRun[]): PipelineRun[] {
  const liveNames = new Set(live.map((pr) => pr.metadata.name));
  const merged = [...live, ...history.filter((pr) => !liveNames.has(pr.metadata.name))];

  return merged
    .map((pr) => ({ pr, timeMs: pipelineRunTimeMs(pr) }))
    .sort((a, b) => b.timeMs - a.timeMs)
    .map(({ pr }) => pr);
}
