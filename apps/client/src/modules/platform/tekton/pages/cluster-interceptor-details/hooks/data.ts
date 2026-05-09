import { useClusterInterceptorWatchItem } from "@/k8s/api/groups/Tekton/ClusterInterceptor";
import { routeClusterInterceptorDetails } from "../route";

export const useClusterInterceptorWatch = () => {
  const params = routeClusterInterceptorDetails.useParams();
  return useClusterInterceptorWatchItem({ name: params.name });
};
