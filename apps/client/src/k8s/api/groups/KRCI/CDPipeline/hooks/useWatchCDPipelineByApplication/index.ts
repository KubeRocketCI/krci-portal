import { useCDPipelineWatchList } from "..";
import { useQuery } from "@tanstack/react-query";

export const useWatchCDPipelineByApplicationQuery = (
  codebaseName: string | undefined,
  namespace: string | undefined
) => {
  const cdPipelineListWatch = useCDPipelineWatchList({
    namespace,
    queryOptions: {
      enabled: !!codebaseName,
    },
  });

  return useQuery({
    queryKey: ["cd-pipeline-by-application", codebaseName, namespace, cdPipelineListWatch.resourceVersion],
    queryFn: () => {
      return cdPipelineListWatch.data.array.find((item) => item.spec.applications.includes(codebaseName!));
    },
    enabled: !!codebaseName && !!namespace && cdPipelineListWatch.query.isFetched,
  });
};
