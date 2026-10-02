import {
  getPipelineRunRefKey,
  K8sApiError,
  k8sPipelineRunConfig,
  pipelineRunStopResult,
  planPipelineRunStop,
  type PipelineRun,
  type PipelineRunRef,
} from "@my-project/shared";
import { K8sClient } from "../../clients/k8s/index.js";
import { pipelineRunStopReason, type PipelineRunStopOutcome } from "../../schemas/pipelineRunStop.js";
import { mapWithConcurrency } from "../../utils/mapWithConcurrency/index.js";

const PIPELINE_RUN_STOP_CONCURRENCY = 8;

export type PipelineRunStopClient = Pick<K8sClient, "getResource" | "patchResource">;

/**
 * Stops each run with the user's own client: GET, plan, then JSON merge PATCH.
 *
 * - One outcome per unique run, in input order.
 * - At most `PIPELINE_RUN_STOP_CONCURRENCY` runs in flight.
 * - Never rejects: per-run errors become `skipped` or `failed` outcomes.
 */
export function stopPipelineRuns(
  k8sClient: PipelineRunStopClient,
  runs: readonly PipelineRunRef[]
): Promise<PipelineRunStopOutcome[]> {
  const uniqueRuns = [...new Map(runs.map((run) => [getPipelineRunRefKey(run), run])).values()];

  return mapWithConcurrency(uniqueRuns, PIPELINE_RUN_STOP_CONCURRENCY, (run) => stopPipelineRun(k8sClient, run));
}

async function planLiveRun(k8sClient: PipelineRunStopClient, run: PipelineRunRef) {
  const liveRun = (await k8sClient.getResource(k8sPipelineRunConfig, run.name, run.namespace)) as PipelineRun;
  return planPipelineRunStop(liveRun);
}

async function stopPipelineRun(k8sClient: PipelineRunStopClient, run: PipelineRunRef): Promise<PipelineRunStopOutcome> {
  try {
    const plan = await planLiveRun(k8sClient, run);

    if (plan.action === "skip") {
      return { ...run, result: pipelineRunStopResult.skipped, reason: plan.reason };
    }

    try {
      await k8sClient.patchResource(k8sPipelineRunConfig, run.name, run.namespace, plan.patch, "merge");
    } catch (error) {
      if (!(error instanceof K8sApiError) || error.statusCode !== 400) throw error;

      // Tekton rejects updates to a run that completed after the GET; the re-read classifies it.
      const replan = await planLiveRun(k8sClient, run);
      if (replan.action === "patch") throw error;
      return { ...run, result: pipelineRunStopResult.skipped, reason: replan.reason };
    }

    return { ...run, result: pipelineRunStopResult.stopping };
  } catch (error) {
    return toErrorOutcome(run, error);
  }
}

function toErrorOutcome(run: PipelineRunRef, error: unknown): PipelineRunStopOutcome {
  if (error instanceof K8sApiError) {
    if (error.statusCode === 404) {
      return { ...run, result: pipelineRunStopResult.skipped, reason: pipelineRunStopReason.not_found };
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      return { ...run, result: pipelineRunStopResult.failed, reason: pipelineRunStopReason.forbidden };
    }
  }

  console.error(`Failed to stop PipelineRun ${getPipelineRunRefKey(run)}:`, error);

  return { ...run, result: pipelineRunStopResult.failed, reason: pipelineRunStopReason.error };
}
