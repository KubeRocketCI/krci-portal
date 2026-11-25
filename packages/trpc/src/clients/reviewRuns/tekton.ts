import {
  buildAnnotationClause,
  getPipelineRunAnnotation,
  getPipelineRunStatus,
  isHistoryPipelineRun,
  isSafeCELStringContent,
  k8sPipelineRunConfig,
  mergeLiveAndHistoryPipelineRuns,
  normalizeResultToPipelineRun,
  pipelineRunLabels,
  pipelineType,
  RECORD_TYPES,
  tektonResultAnnotations,
  toCELStringLiteral,
  type AgentReviewRuns,
  type CodebaseRef,
  type KubeObjectListBase,
  type MergeRequest,
  type PipelineRun,
  type ReviewRun,
  type ReviewRunHistory,
  type TektonResult,
} from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import type { CustomSession } from "../../context/types.js";
import { HttpNotConfiguredError } from "../http/index.js";
import { K8sClient } from "../k8s/index.js";
import {
  createTektonResultsClient,
  TEKTON_RESULTS_SERVICE_NAME,
  type TektonResultsClient,
} from "../tektonResults/index.js";
import type { ReviewRunQuery, ReviewRunSource } from "./source.js";

/**
 * One page, newest first, of the issue branch in the Codebase; older runs are not shown.
 * A branch name unsafe in a CEL literal reads the page of the whole Codebase.
 */
const HISTORY_PAGE_SIZE = 50;

/** Shorter than the 15 s poll of the Agent detail: a slow Tekton Results must not hold back the live runs. */
const HISTORY_TIMEOUT_MS = 5_000;

/** A failed history read of one Codebase is logged at most once per interval. */
const ERROR_LOG_INTERVAL_MS = 60_000;

const byName = (a: PipelineRun, b: PipelineRun) => a.metadata.name.localeCompare(b.metadata.name);

/** A Result with no `object.metadata.name` gets its uid as name and does not merge with its live run. */
const hasRunName = (result: TektonResult) => {
  const name = result.annotations?.[tektonResultAnnotations.objectMetadataName];
  return typeof name === "string" && name !== "";
};

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
    origin: isHistoryPipelineRun(pipelineRun) ? "history" : "live",
  };
}

/** An unsafe branch name gets no branch clause; `groupByMergeRequest` keeps the issue branch. */
function historyFilterOf(codebase: CodebaseRef, issueBranch: string): string {
  return [
    `summary.type == ${toCELStringLiteral(RECORD_TYPES.PIPELINE_RUN)}`,
    buildAnnotationClause(tektonResultAnnotations.codebase, codebase.name),
    buildAnnotationClause(tektonResultAnnotations.pipelineType, pipelineType.review),
    ...(isSafeCELStringContent(issueBranch)
      ? [buildAnnotationClause(tektonResultAnnotations.gitBranch, issueBranch)]
      : []),
  ].join(" && ");
}

/** `runs` newest first (`mergeLiveAndHistoryPipelineRuns`). The newest run of a change number gives the link and the target branch of its merge request. */
function groupByMergeRequest(runs: PipelineRun[], issueBranch: string): MergeRequest[] {
  const runsByNumber = new Map<string, PipelineRun[]>();
  for (const run of runs) {
    if (getPipelineRunAnnotation(run, tektonResultAnnotations.gitBranch) !== issueBranch) continue;
    const number = getPipelineRunAnnotation(run, tektonResultAnnotations.gitChangeNumber);
    if (!number) continue;
    const group = runsByNumber.get(number);
    if (group) group.push(run);
    else runsByNumber.set(number, [run]);
  }

  return [...runsByNumber].map(([number, group]) => {
    const [newest] = group;
    return {
      number,
      url: httpUrlOf(getPipelineRunAnnotation(newest, tektonResultAnnotations.gitChangeUrl)),
      sourceBranch: issueBranch,
      targetBranch: getPipelineRunAnnotation(newest, tektonResultAnnotations.gitTargetBranch) ?? null,
      title: null,
      state: null,
      draft: null,
      reviewRuns: group.map(toReviewRun),
    };
  });
}

/** Live PipelineRuns are read with the session `idToken`; history with the portal ServiceAccount token of the Tekton Results client. */
export class TektonReviewRunSource implements ReviewRunSource {
  private readonly errorLoggedAt = new Map<string, number>();

  constructor(
    private readonly k8sClientOf: (session: CustomSession) => K8sClient = (session) => new K8sClient(session),
    private readonly historyClientOf: (namespace: string) => TektonResultsClient = (namespace) =>
      createTektonResultsClient(namespace, { timeoutMs: HISTORY_TIMEOUT_MS })
  ) {}

  /** Equal creation times: live runs first, each list by name. */
  async listReviewRuns(session: CustomSession, { codebase, issueBranch }: ReviewRunQuery): Promise<AgentReviewRuns> {
    const historyRead = this.listHistory(codebase, issueBranch);
    const live = await this.listLive(session, codebase);
    const { history, runs } = await historyRead;

    return {
      mergeRequests: groupByMergeRequest(
        mergeLiveAndHistoryPipelineRuns(live.sort(byName), runs.sort(byName)),
        issueBranch
      ),
      history,
    };
  }

  private async listLive(session: CustomSession, codebase: CodebaseRef): Promise<PipelineRun[]> {
    const labelSelector = [
      `${pipelineRunLabels.codebase}=${codebase.name}`,
      `${pipelineRunLabels.pipelineType}=${pipelineType.review}`,
    ].join(",");
    const list = (await this.k8sClientOf(session).listAllResources(
      k8sPipelineRunConfig,
      codebase.namespace,
      labelSelector
    )) as KubeObjectListBase<PipelineRun>;
    return list.items ?? [];
  }

  /** Never rejects. */
  private async listHistory(
    codebase: CodebaseRef,
    issueBranch: string
  ): Promise<{ history: ReviewRunHistory; runs: PipelineRun[] }> {
    try {
      const response = await this.historyClientOf(codebase.namespace).listResults({
        filter: historyFilterOf(codebase, issueBranch),
        pageSize: HISTORY_PAGE_SIZE,
        orderBy: "create_time desc",
      });
      const runs = (response?.results ?? [])
        .filter(hasRunName)
        .map((result) => normalizeResultToPipelineRun(result, codebase.namespace));
      return { history: "ready", runs };
    } catch (error) {
      if (error instanceof TRPCError && error.cause instanceof HttpNotConfiguredError) {
        return { history: "notConfigured", runs: [] };
      }
      this.logUnreachable(codebase, error);
      return { history: "unreachable", runs: [] };
    }
  }

  private logUnreachable(codebase: CodebaseRef, error: unknown): void {
    const key = `${codebase.namespace}/${codebase.name}`;
    const now = Date.now();
    const last = this.errorLoggedAt.get(key);
    if (last !== undefined && now - last < ERROR_LOG_INTERVAL_MS) return;
    this.errorLoggedAt.set(key, now);
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${TEKTON_RESULTS_SERVICE_NAME}] unreachable: review runs of ${key}: ${message}`);
  }
}
