import React from "react";
import { useStageWatchList } from "../../../Stage";
import { useCDPipelineWatchItem } from "..";

export const useWatchCDPipelineByAutotest = (codebaseName: string | undefined, namespace: string | undefined) => {
  const stageListWatch = useStageWatchList({
    namespace,
    queryOptions: {
      enabled: !!codebaseName,
    },
  });

  const cdPipelineName = React.useMemo(() => {
    const stage = stageListWatch.data.array.find((stage) => {
      return stage.spec.qualityGates.some((qualityGate: { autotestName?: string | null }) => {
        return qualityGate.autotestName === codebaseName;
      });
    });

    return stage?.spec.cdPipeline;
  }, [codebaseName, stageListWatch.data.array]);

  return useCDPipelineWatchItem({
    name: cdPipelineName,
    namespace,
    queryOptions: {
      enabled: !!cdPipelineName,
    },
  });
};
