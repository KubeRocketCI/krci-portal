import { usePipelineWatchItem } from "@/k8s/api/groups/Tekton/Pipeline";
import { routePipelineDetails } from "../route";

export const usePipelineWatch = () => {
  const params = routePipelineDetails.useParams();

  return usePipelineWatchItem({
    name: params.name,
    namespace: params.namespace,
  });
};
