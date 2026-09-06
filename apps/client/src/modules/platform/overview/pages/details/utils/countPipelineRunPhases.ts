import { getPipelineRunStatus, pipelineRunPhase, type PipelineRun } from "@my-project/shared";
import type { LoadedResourceHealth } from "./statusSegments";

export function countPipelineRunPhases(runs: readonly PipelineRun[]): LoadedResourceHealth {
  return runs.reduce<LoadedResourceHealth>(
    (acc, run) => {
      const { phase } = getPipelineRunStatus(run);

      switch (phase) {
        case pipelineRunPhase["in-progress"]:
          acc.inProgress++;
          break;
        // `cancelling` is grouped with `cancelled`, matching the list filter.
        case pipelineRunPhase.cancelling:
        case pipelineRunPhase.cancelled:
          acc.cancelled++;
          break;
        case pipelineRunPhase.succeeded:
          acc.ok++;
          break;
        case pipelineRunPhase.failed:
          acc.error++;
          break;
        case pipelineRunPhase.unknown:
          acc.unknown++;
          break;
        default: {
          const _exhaustiveCheck: never = phase;
          throw new Error(`Unhandled PipelineRun phase: ${_exhaustiveCheck}`);
        }
      }

      acc.total++;

      return acc;
    },
    { total: 0, ok: 0, error: 0, inProgress: 0, cancelled: 0, unknown: 0 }
  );
}
