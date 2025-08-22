import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { codebaseStatus } from "@my-project/shared";
import React from "react";

interface GraphData {
  total: number;
  ok: number;
  error: number;
  inProgress: number;
  unknown: number;
}

export const useCodebasesGraphData = () => {
  const codebaseListWatch = useCodebaseWatchList();

  const graphData = React.useMemo(() => {
    if (codebaseListWatch.query.isFetching || !codebaseListWatch.query.data) {
      return {
        total: null,
        ok: null,
        error: null,
        inProgress: null,
        unknown: null,
      };
    }

    return codebaseListWatch.dataArray.reduce<GraphData>(
      (acc, cur) => {
        const status = cur?.status?.status;

        switch (status) {
          case codebaseStatus.created:
            acc.ok++;
            break;
          case codebaseStatus.initialized:
            acc.inProgress++;
            break;
          case codebaseStatus.in_progress:
            acc.inProgress++;
            break;
          case codebaseStatus.failed:
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
  }, [codebaseListWatch.dataArray, codebaseListWatch.query.data, codebaseListWatch.query.isFetching]);

  return {
    graphData,
    isLoading: codebaseListWatch.query.isFetching,
    error: codebaseListWatch.query.error,
  };
};
