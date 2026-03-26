import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import SASTProjectDetailsPageContent from "./view";
import { routeSASTProjectDetails } from "./route";
import { tabNameToIndexMap } from "./constants";

export default function SASTProjectDetailsPage() {
  const search = routeSASTProjectDetails.useSearch();
  const tabName = search.tab;
  const initialTabIdx = tabName ? tabNameToIndexMap[tabName] : 0;

  return (
    <TabsContextProvider id="sast-project-details-page" initialTabIdx={initialTabIdx}>
      <SASTProjectDetailsPageContent searchTabIdx={initialTabIdx} />
    </TabsContextProvider>
  );
}
