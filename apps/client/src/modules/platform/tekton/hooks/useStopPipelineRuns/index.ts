import { useTRPCClient } from "@/core/providers/trpc";
import type { Severity } from "@/core/utils/severity";
import { usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useK8sActionMutation } from "@/modules/k8s/hooks/useK8sActionMutation";
import {
  PIPELINE_RUN_STOP_MAX_RUNS,
  summarizePipelineRunStop,
  toPipelineRunRef,
  type PipelineRun,
} from "@my-project/shared";
import type { RouterOutput } from "@my-project/trpc";
import React from "react";

export type StopPipelineRunsOutput = RouterOutput["pipelineRun"]["stop"];
export type PipelineRunStopOutcome = StopPipelineRunsOutput["results"][number];
type PipelineRunStopReason = NonNullable<PipelineRunStopOutcome["reason"]>;

export const pipelineRunStopReasonLabels: Record<PipelineRunStopReason, string> = {
  already_done: "already finished",
  already_stopping: "already stopping",
  not_found: "not found",
  forbidden: "no permission",
  error: "Kubernetes API error",
};

const describeRuns = (runs: readonly PipelineRun[]) =>
  runs.length === 1 ? `PipelineRun ${runs[0].metadata.name}` : `${runs.length} PipelineRuns`;

const describeOutcome = (runs: readonly PipelineRun[], { results, summary }: StopPipelineRunsOutput) => {
  if (results.length === 1) {
    const [{ name, result, reason }] = results;
    const reasonLabel = reason ? pipelineRunStopReasonLabels[reason] : "";

    if (result === "stopping") return `PipelineRun ${name} is stopping`;
    if (result === "skipped") return `PipelineRun ${name} was not stopped: ${reasonLabel}`;
    return `Failed to stop PipelineRun ${name}: ${reasonLabel}`;
  }

  return [
    `Stopping ${summary.stopping} of ${runs.length} PipelineRuns`,
    summary.skipped ? `${summary.skipped} skipped` : "",
    summary.failed ? `${summary.failed} failed` : "",
  ]
    .filter(Boolean)
    .join(" · ");
};

const outcomeSeverity = ({ summary }: StopPipelineRunsOutput): Severity => {
  if (summary.failed) return summary.stopping ? "warning" : "error";
  return summary.stopping ? "success" : "info";
};

/**
 * Stops PipelineRuns gracefully through `pipelineRun.stop`.
 *
 * - `stop` sends runs in sequential requests of up to `PIPELINE_RUN_STOP_MAX_RUNS`.
 * - `stop` shows one toast and resolves to the per-run outcomes; it resolves to `undefined`
 *   when the first request fails, after an error toast.
 * - A later failed request stops the batch; its runs and the unsent ones are `failed` with
 *   reason `error`.
 * - `permission` is the `patch` permission on PipelineRuns.
 * - No query invalidation: PipelineRun lists and details are watch-driven.
 */
export function useStopPipelineRuns() {
  const trpc = useTRPCClient();
  const permissions = usePipelineRunPermissions();

  const mutation = useK8sActionMutation<readonly PipelineRun[], StopPipelineRunsOutput>({
    mutationKey: "stop:PipelineRun",
    mutationFn: async (runs) => {
      const refs = runs.map(toPipelineRunRef);
      const results: StopPipelineRunsOutput["results"] = [];

      for (let start = 0; start < refs.length; start += PIPELINE_RUN_STOP_MAX_RUNS) {
        try {
          const chunk = await trpc.pipelineRun.stop.mutate({
            runs: refs.slice(start, start + PIPELINE_RUN_STOP_MAX_RUNS),
          });
          results.push(...chunk.results);
        } catch (error) {
          if (start === 0) throw error;

          results.push(
            ...refs.slice(start).map((ref) => ({ ...ref, result: "failed" as const, reason: "error" as const }))
          );
          break;
        }
      }

      return { results, summary: summarizePipelineRunStop(results) };
    },
    messages: {
      loading: (runs) => `Stopping ${describeRuns(runs)}…`,
      success: describeOutcome,
      error: (runs) => `Failed to stop ${describeRuns(runs)}`,
    },
    successSeverity: (_, output) => outcomeSeverity(output),
    invalidationKeys: () => [],
  });

  const { mutateAsync } = mutation;
  const stop = React.useCallback(
    (runs: readonly PipelineRun[]): Promise<StopPipelineRunsOutput | undefined> =>
      mutateAsync(runs).catch(() => undefined),
    [mutateAsync]
  );

  return {
    stop,
    isPending: mutation.isPending,
    permission: permissions.data.patch,
  };
}
