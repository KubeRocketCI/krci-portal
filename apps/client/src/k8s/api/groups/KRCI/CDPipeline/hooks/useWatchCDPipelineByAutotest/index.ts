
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
