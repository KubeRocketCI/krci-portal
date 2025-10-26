import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { stageStatus } from "@my-project/shared";
import React from "react";

interface GraphData {
  total: number;
  ok: number;
  error: number;
  inProgress: number;
  unknown: number;
}

export const useStagesGraphData = () => {
  const stageListWatch = useStageWatchList();

  const graphData = React.useMemo(() => {
    if (stageListWatch.query.isFetching || !stageListWatch.query.data) {
      return {
        total: null,
        ok: null,
        error: null,
        inProgress: null,
        unknown: null,
      };
    }

    return stageListWatch.data.array.reduce<GraphData>(
      (acc, cur) => {
        const status = cur?.status?.status;

        switch (status) {
          case stageStatus.created:
            acc.ok++;
            break;
          case stageStatus.initialized:
            acc.inProgress++;
            break;
          case stageStatus.in_progress:
            acc.inProgress++;
            break;
          case stageStatus.failed:
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
      }
    );
  }, [stageListWatch.data.array, stageListWatch.query.data, stageListWatch.query.isFetching]);

  return {
    graphData,
    isLoading: stageListWatch.query.isFetching,
    error: stageListWatch.query.error,
  };
};
