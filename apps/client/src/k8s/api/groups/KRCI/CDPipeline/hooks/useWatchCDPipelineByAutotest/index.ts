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
    // Guards the opt-out `undefined`, which would otherwise make the predicate
    // `undefined === undefined` and match every manual quality gate. Disabling the
    // list query is not enough — React Query still serves its cached data.
    if (!codebaseName) {
      return undefined;
    }

    const stage = stageListWatch.data.array.find((stage) =>
      stage.spec.qualityGates.some((qualityGate) => qualityGate.autotestName === codebaseName)
    );

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
