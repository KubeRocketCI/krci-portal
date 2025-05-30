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
    const stage = stageListWatch.dataArray.find((stage) => {
      return stage.spec.qualityGates.some((qualityGate) => {
        return qualityGate.autotestName === codebaseName;
      });
    });

    return stage?.spec.cdPipeline;
  }, [codebaseName, stageListWatch.dataArray]);

  return useCDPipelineWatchItem({
    name: cdPipelineName,
    namespace,
    queryOptions: {
      enabled: !!cdPipelineName,
    },
  });
};
