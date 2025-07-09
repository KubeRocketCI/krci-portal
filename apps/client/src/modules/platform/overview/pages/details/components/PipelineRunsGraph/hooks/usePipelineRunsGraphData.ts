import { usePipelineRunWatchList } from "@/core/k8s/api/groups/Tekton/PipelineRun";
import { getPipelineRunStatus, pipelineRunReason, pipelineRunStatus } from "@my-project/shared";
import React from "react";

interface GraphData {
  total: number;
  ok: number;
  error: number;
  inProgress: number;
  unknown: number;
  suspended: number;
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
        suspended: null,
      };
    }

    return pipelineRunListWatch.dataArray.reduce<GraphData>(
      (acc, cur) => {
        const { status, reason } = getPipelineRunStatus(cur);

        const _status = status.toLowerCase();
        const _reason = reason.toLowerCase();

        switch (_status) {
          case pipelineRunStatus.unknown:
            if (_reason === pipelineRunReason.started || _reason === pipelineRunReason.running) {
              acc.inProgress++;
            }

            if (_reason === pipelineRunReason.cancelled) {
              acc.suspended++;
            }
            break;
          case pipelineRunStatus.true:
            acc.ok++;
            break;
          case pipelineRunStatus.false:
            acc.error++;
            break;
          default:
            acc.unknown++;
            break;
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
        suspended: 0,
      }
    );
  }, [pipelineRunListWatch.dataArray, pipelineRunListWatch.query.data, pipelineRunListWatch.query.isFetching]);

  return {
    graphData,
    isLoading: pipelineRunListWatch.query.isFetching,
    error: pipelineRunListWatch.query.error,
  };
};
