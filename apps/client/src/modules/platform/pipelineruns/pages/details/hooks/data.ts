import { usePipelineRunWatchItem } from "@/core/k8s/api/groups/Tekton/PipelineRun";
import { routePipelineRunDetails } from "../route";

export const usePipelineRunWatch = () => {
  const params = routePipelineRunDetails.useParams();

  return usePipelineRunWatchItem({
    namespace: params.namespace,
    name: params.name,
  });
};
