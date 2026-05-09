import { useInterceptorWatchItem } from "@/k8s/api/groups/Tekton/Interceptor";
import { routeInterceptorDetails } from "../route";

export const useInterceptorWatch = () => {
  const params = routeInterceptorDetails.useParams();
  return useInterceptorWatchItem({ namespace: params.namespace, name: params.name });
};
