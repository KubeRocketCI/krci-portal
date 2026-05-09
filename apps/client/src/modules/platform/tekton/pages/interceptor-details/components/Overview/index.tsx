import { InterceptorOverview } from "@/modules/platform/tekton/components/InterceptorOverview";
import { useInterceptorWatch } from "../../hooks/data";

export const Overview = () => {
  const watch = useInterceptorWatch();
  return <InterceptorOverview resource={watch.query.data} isLoading={watch.isLoading} />;
};
