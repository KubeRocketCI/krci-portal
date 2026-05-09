import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { tabNameToIndexMap } from "./constants";
import { routeClusterInterceptorDetails } from "./route";
import ClusterInterceptorDetailsView from "./view";

export default function ClusterInterceptorDetailsPage() {
  const search = routeClusterInterceptorDetails.useSearch();
  const initialTabIdx = search.tab ? tabNameToIndexMap[search.tab] : 0;
  return (
    <TabsContextProvider id="cluster-interceptor-details-page" initialTabIdx={initialTabIdx}>
      <ClusterInterceptorDetailsView searchTabIdx={initialTabIdx} />
    </TabsContextProvider>
  );
}
