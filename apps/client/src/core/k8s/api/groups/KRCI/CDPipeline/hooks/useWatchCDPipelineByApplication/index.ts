import React from "react";
import { useCDPipelineWatchList } from "..";

export const useWatchCDPipelineByApplication = (codebaseName: string | undefined, namespace: string | undefined) => {
  const cdPipelineListWatch = useCDPipelineWatchList({
    namespace,
    queryOptions: {
      enabled: !!codebaseName,
    },
  });

  return React.useMemo(() => {
    return cdPipelineListWatch.dataArray.find((item) => item.spec.applications.includes(codebaseName!));
  }, [cdPipelineListWatch.dataArray, codebaseName]);
};
