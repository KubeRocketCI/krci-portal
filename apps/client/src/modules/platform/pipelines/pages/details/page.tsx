import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import PipelineDetailsPageContent from "./view";
import { routePipelineDetails } from "./route";
import { tabNameToIndexMap } from "./constants";

export const PipelineDetailsPage = () => {
  const search = routePipelineDetails.useSearch();
  const tabName = search.tab;
  const initialTabIdx = tabName ? tabNameToIndexMap[tabName] : 0;

  return (
    <TabsContextProvider id="pipeline-details-page" initialTabIdx={initialTabIdx}>
      <PipelineDetailsPageContent />
    </TabsContextProvider>
  );
};
