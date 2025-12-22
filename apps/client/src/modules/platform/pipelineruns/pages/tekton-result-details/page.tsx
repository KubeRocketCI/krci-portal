import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import TektonResultPipelineRunDetailsPageContent from "./view";
import { routeTektonResultPipelineRunDetails } from "./route";
import { tabNameToIndexMap } from "./constants";

export const TektonResultPipelineRunDetailsPage = () => {
  const search = routeTektonResultPipelineRunDetails.useSearch();
  const tabName = search.tab;
  const initialTabIdx = tabName ? tabNameToIndexMap[tabName] : 0;

  return (
    <TabsContextProvider id="tekton-result-pipeline-run-details-page" initialTabIdx={initialTabIdx}>
      <TektonResultPipelineRunDetailsPageContent />
    </TabsContextProvider>
  );
};
