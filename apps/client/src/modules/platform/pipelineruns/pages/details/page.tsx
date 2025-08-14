import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import PipelineRunDetailsPageContent from "./view";

export const PipelineRunDetailsPage = () => {
  return (
    <TabsContextProvider id="pipeline-run-details-page" initialTabIdx={0}>
      <PipelineRunDetailsPageContent />
    </TabsContextProvider>
  );
};
