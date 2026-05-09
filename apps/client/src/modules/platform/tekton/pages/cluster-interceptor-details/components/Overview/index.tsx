import { InterceptorOverview } from "@/modules/platform/tekton/components/InterceptorOverview";
import { useClusterInterceptorWatch } from "../../hooks/data";

export const Overview = () => {
  const watch = useClusterInterceptorWatch();
  return <InterceptorOverview resource={watch.query.data} isLoading={watch.isLoading} />;
};
