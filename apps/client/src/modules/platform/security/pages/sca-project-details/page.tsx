import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import SCAProjectDetailsPageContent from "./view";
import { routeSCAProjectDetails } from "./route";
import { tabNameToIndexMap } from "./constants";

export default function SCAProjectDetailsPage() {
  const search = routeSCAProjectDetails.useSearch();
  const tabName = search.tab;
  const initialTabIdx = tabName ? tabNameToIndexMap[tabName] : 0;

  return (
    <TabsContextProvider id="sca-project-details-page" initialTabIdx={initialTabIdx}>
      <SCAProjectDetailsPageContent searchTabIdx={initialTabIdx} />
    </TabsContextProvider>
  );
}
