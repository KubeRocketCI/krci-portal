import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { getPipelineRunStatus, pipelineRunPhase } from "@my-project/shared";
import React from "react";

interface GraphData {
  total: number;
  ok: number;
  error: number;
  inProgress: number;
  unknown: number;
  cancelled: number;
}

export const usePipelineRunsGraphData = () => {
  const pipelineRunListWatch = usePipelineRunWatchList();

  const graphData = React.useMemo(() => {
    if (pipelineRunListWatch.query.isFetching || !pipelineRunListWatch.query.data) {
      return {
        total: null,
        ok: null,
        error: null,
        inProgress: null,
        unknown: null,
        cancelled: null,
      };
    }

    return pipelineRunListWatch.data.array.reduce<GraphData>(
      (acc, cur) => {
        const { phase } = getPipelineRunStatus(cur);

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
      {
        total: 0,
        ok: 0,
        error: 0,
        inProgress: 0,
        unknown: 0,
        cancelled: 0,
      }
    );
  }, [pipelineRunListWatch.data.array, pipelineRunListWatch.query.data, pipelineRunListWatch.query.isFetching]);

  return {
    graphData,
    isLoading: pipelineRunListWatch.query.isFetching,
    error: pipelineRunListWatch.query.error,
  };
};
