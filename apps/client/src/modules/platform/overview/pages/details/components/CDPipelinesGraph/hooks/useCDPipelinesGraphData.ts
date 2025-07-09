import { useCDPipelineWatchList } from "@/core/k8s/api/groups/KRCI/CDPipeline";
import { cdPipelineStatus } from "@my-project/shared";
import React from "react";

interface GraphData {
  total: number;
  ok: number;
  error: number;
  inProgress: number;
  unknown: number;
}

export const useCDPipelinesGraphData = () => {
  const cdPipelineListWatch = useCDPipelineWatchList();

  const graphData = React.useMemo(() => {
    if (cdPipelineListWatch.query.isLoading || !cdPipelineListWatch.query.data) {
      return {
        total: null,
        ok: null,
        error: null,
        inProgress: null,
        unknown: null,
      };
    }

    return cdPipelineListWatch.dataArray.reduce<GraphData>(
      (acc, cur) => {
        const status = cur?.status?.status;

        switch (status) {
          case cdPipelineStatus.created:
            acc.ok++;
            break;
          case cdPipelineStatus.initialized:
            acc.inProgress++;
            break;
          case cdPipelineStatus.in_progress:
            acc.inProgress++;
            break;
          case cdPipelineStatus.failed:
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
  }, [cdPipelineListWatch.dataArray, cdPipelineListWatch.query.data, cdPipelineListWatch.query.isLoading]);

  return {
    graphData,
    isLoading: cdPipelineListWatch.query.isLoading,
    error: cdPipelineListWatch.query.error,
  };
};
