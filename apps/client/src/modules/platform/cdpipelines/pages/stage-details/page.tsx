import { ViewModeContextProvider } from "@/core/providers/ViewMode/provider";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import StageDetailsPageContent from "./view";

export default function StageDetailsPage() {
  return (
    <ViewModeContextProvider entityID={"cdpipeline"} defaultViewMode={VIEW_MODES.COMPACT}>
      <StageDetailsPageContent />
    </ViewModeContextProvider>
  );
}
