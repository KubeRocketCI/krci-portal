import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { useDefectDojoWebUrl } from "@/modules/platform/security/components/defectdojo/hooks/useDefectDojoWebUrl";
import CodebaseDetailsPageContent from "./view";
import { routeProjectDetails } from "./route";
import { getTabIndex } from "./constants";

export default function CodebaseDetailsPage() {
  const search = routeProjectDetails.useSearch();
  const hasFindingsTab = !!useDefectDojoWebUrl();
  const initialTabIdx = getTabIndex(search.tab, hasFindingsTab);

  return (
    <TabsContextProvider id="codebase-details-page" initialTabIdx={initialTabIdx}>
      <CodebaseDetailsPageContent searchTabIdx={initialTabIdx} />
    </TabsContextProvider>
  );
}
