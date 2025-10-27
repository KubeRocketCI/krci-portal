import React from "react";
import { useCDPipelineWatchItem } from "..";
import { useStageWatchList } from "../../../Stage";

export const useWatchCDPipelineByStageAutotest = (codebaseName: string | undefined, namespace: string | undefined) => {
  const stageListWatch = useStageWatchList({
    namespace,
    queryOptions: {
      enabled: !!codebaseName,
    },
  });

  const cdPipelineName = React.useMemo(() => {
    const stage = stageListWatch.data.array.find((stage) => {
      return stage.spec.qualityGates.some((qualityGate) => {
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
