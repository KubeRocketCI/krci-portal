import React from "react";
import { useCDPipelineWatchList } from "..";

export const useWatchCDPipelineByInputDockerStream = (
  inputDockerStream: string | undefined,
  namespace: string | undefined
) => {
  const cdPipelineListWatch = useCDPipelineWatchList({
    namespace,
    queryOptions: {
      enabled: !!inputDockerStream,
    },
  });

  const data = React.useMemo(() => {
    if (!inputDockerStream) {
      return undefined;
    }

    return cdPipelineListWatch.data.array.find((item) => item.spec.inputDockerStreams.includes(inputDockerStream));
  }, [inputDockerStream, cdPipelineListWatch.data.array]);

  return { data };
};
