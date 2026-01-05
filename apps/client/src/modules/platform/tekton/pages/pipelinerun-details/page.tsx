import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import PipelineRunDetailsPageContent from "./view";
import { routePipelineRunDetails } from "./route";
import { tabNameToIndexMap } from "./constants";

export const PipelineRunDetailsPage = () => {
  const search = routePipelineRunDetails.useSearch();
  const tabName = search.tab;
  const initialTabIdx = tabName ? tabNameToIndexMap[tabName] : 0;

  return (
    <TabsContextProvider id="pipeline-run-details-page" initialTabIdx={initialTabIdx}>
      <PipelineRunDetailsPageContent />
    </TabsContextProvider>
  );
};
