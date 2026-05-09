import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { tabNameToIndexMap } from "./constants";
import { routeInterceptorDetails } from "./route";
import InterceptorDetailsView from "./view";

export default function InterceptorDetailsPage() {
  const search = routeInterceptorDetails.useSearch();
  const initialTabIdx = search.tab ? tabNameToIndexMap[search.tab] : 0;
  return (
    <TabsContextProvider id="interceptor-details-page" initialTabIdx={initialTabIdx}>
      <InterceptorDetailsView searchTabIdx={initialTabIdx} />
    </TabsContextProvider>
  );
}
