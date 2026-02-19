import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import CodebaseDetailsPageContent from "./view";
import { routeProjectDetails } from "./route";
import { tabNameToIndexMap } from "./constants";

export default function CodebaseDetailsPage() {
  const search = routeProjectDetails.useSearch();
  const tabName = search.tab;
  const initialTabIdx = tabName ? tabNameToIndexMap[tabName] : 0;

  return (
    <TabsContextProvider id="codebase-details-page" initialTabIdx={initialTabIdx}>
      <CodebaseDetailsPageContent />
    </TabsContextProvider>
  );
}
