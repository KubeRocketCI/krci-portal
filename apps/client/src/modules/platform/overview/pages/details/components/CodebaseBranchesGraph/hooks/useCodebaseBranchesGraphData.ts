import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { codebaseBranchStatus } from "@my-project/shared";
import React from "react";

interface GraphData {
  total: number;
  ok: number;
  error: number;
  inProgress: number;
  unknown: number;
}

export const useCodebaseBranchesGraphData = () => {
  const codebaseBranchListWatch = useCodebaseBranchWatchList();

  const graphData = React.useMemo(() => {
    if (codebaseBranchListWatch.query.isFetching || !codebaseBranchListWatch.query.data) {
      return {
        total: null,
        ok: null,
        error: null,
        inProgress: null,
        unknown: null,
      };
    }

    return codebaseBranchListWatch.data.array.reduce<GraphData>(
      (acc, cur) => {
        const status = cur?.status?.status;

        switch (status) {
          case codebaseBranchStatus.created:
            acc.ok++;
            break;
          case codebaseBranchStatus.initialized:
            acc.inProgress++;
            break;
          case codebaseBranchStatus.in_progress:
            acc.inProgress++;
            break;
          case codebaseBranchStatus.failed:
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
  }, [
    codebaseBranchListWatch.data.array,
    codebaseBranchListWatch.query.data,
    codebaseBranchListWatch.query.isFetching,
  ]);

  return {
    graphData,
    isLoading: codebaseBranchListWatch.query.isFetching,
    error: codebaseBranchListWatch.query.error,
  };
};
