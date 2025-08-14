import { useTaskWatchItem } from "@/k8s/api/groups/Tekton/Task";
import { routeTaskDetails } from "../route";

export const useTaskWatch = () => {
  const params = routeTaskDetails.useParams();

  return useTaskWatchItem({
    namespace: params.namespace,
    name: params.name,
  });
};
