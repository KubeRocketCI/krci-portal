import {
  getPipelineRunAnnotation,
  getPipelineRunStatus,
  k8sPipelineRunConfig,
  pipelineRunLabels,
  pipelineType,
  tektonResultAnnotations,
  type KubeObjectListBase,
  type MergeRequest,
  type PipelineRun,
  type ReviewRun,
} from "@my-project/shared";
import type { CustomSession } from "../../context/types.js";
import { K8sClient } from "../k8s/index.js";
import type { ReviewRunQuery, ReviewRunSource } from "./source.js";

function httpUrlOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}

function durationMsOf(startTime: string | undefined, completionTime: string | undefined): number | null {
  if (!startTime || !completionTime) return null;
  const durationMs = Date.parse(completionTime) - Date.parse(startTime);
  return Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : null;
}

function toReviewRun(pipelineRun: PipelineRun): ReviewRun {
  const { phase, reason } = getPipelineRunStatus(pipelineRun);
  const { startTime, completionTime } = pipelineRun.status ?? {};
  return {
    name: pipelineRun.metadata.name,
    namespace: pipelineRun.metadata.namespace ?? "",
    status: { phase, reason },
    startedAt: startTime ?? null,
    durationMs: durationMsOf(startTime, completionTime),
    commit: getPipelineRunAnnotation(pipelineRun, tektonResultAnnotations.gitCommitSha) ?? null,
    origin: "live",
  };
}

function byNewest(a: PipelineRun, b: PipelineRun): number {
  const created = (run: PipelineRun) => Date.parse(run.metadata.creationTimestamp ?? "") || 0;
  return created(b) - created(a) || a.metadata.name.localeCompare(b.metadata.name);
}

/** The newest run of a change number gives the link and the target branch of its merge request. */
export class TektonReviewRunSource implements ReviewRunSource {
  constructor(
    private readonly k8sClientOf: (session: CustomSession) => K8sClient = (session) => new K8sClient(session)
  ) {}

  async listMergeRequests(session: CustomSession, { codebase, issueBranch }: ReviewRunQuery): Promise<MergeRequest[]> {
    const labelSelector = [
      `${pipelineRunLabels.codebase}=${codebase.name}`,
      `${pipelineRunLabels.pipelineType}=${pipelineType.review}`,
    ].join(",");
    const list = (await this.k8sClientOf(session).listAllResources(
      k8sPipelineRunConfig,
      codebase.namespace,
      labelSelector
    )) as KubeObjectListBase<PipelineRun>;

    const runsByNumber = new Map<string, PipelineRun[]>();
    for (const run of [...(list.items ?? [])].sort(byNewest)) {
      if (getPipelineRunAnnotation(run, tektonResultAnnotations.gitBranch) !== issueBranch) continue;
      const number = getPipelineRunAnnotation(run, tektonResultAnnotations.gitChangeNumber);
      if (!number) continue;
      const group = runsByNumber.get(number);
      if (group) group.push(run);
      else runsByNumber.set(number, [run]);
    }

    return [...runsByNumber].map(([number, runs]) => {
      const [newest] = runs;
      return {
        number,
        url: httpUrlOf(getPipelineRunAnnotation(newest, tektonResultAnnotations.gitChangeUrl)),
        sourceBranch: issueBranch,
        targetBranch: getPipelineRunAnnotation(newest, tektonResultAnnotations.gitTargetBranch) ?? null,
        title: null,
        state: null,
        draft: null,
        reviewRuns: runs.map(toReviewRun),
      };
    });
  }
}
