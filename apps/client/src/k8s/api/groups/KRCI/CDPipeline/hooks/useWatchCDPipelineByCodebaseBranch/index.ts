import React from "react";
import { useCDPipelineWatchItem } from "..";
import { useStageWatchList } from "../../../Stage";

export const useWatchCDPipelineByCodebaseBranch = (
  codebaseBranchName: string | undefined,
  namespace: string | undefined
) => {
  const stageListWatch = useStageWatchList({
    namespace,
    queryOptions: {
      enabled: !!codebaseBranchName,
    },
  });

  const cdPipelineName = React.useMemo(() => {
    const stage = stageListWatch.data.array.find((stage) => {
      return stage.spec.qualityGates.some((qualityGate: { branchName?: string | null }) => {
        return qualityGate.branchName === codebaseBranchName;
      });
    });

    return stage?.spec.cdPipeline;
  }, [codebaseBranchName, stageListWatch.data.array]);

  return useCDPipelineWatchItem({
    name: cdPipelineName,
    namespace,
    queryOptions: {
      enabled: !!cdPipelineName,
    },
  });
};
