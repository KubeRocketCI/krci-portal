// import { FilterProvider } from "@/core/providers/Filter/provider";
// import { useClusterStore } from "@/k8s/store";
import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { ViewModeContextProvider } from "@/core/providers/ViewMode/provider";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import StageDetailsPageContent from "./view";

export default function StageDetailsPage() {
  return (
    <TabsContextProvider id="stage-details">
      <ViewModeContextProvider entityID={"cdpipeline"} defaultViewMode={VIEW_MODES.COMPACT}>
        <StageDetailsPageContent />
      </ViewModeContextProvider>
    </TabsContextProvider>
  );
}
