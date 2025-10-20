import { FilterProvider } from "@/core/providers/Filter";
import { ViewModeContextProvider } from "@/core/providers/ViewMode/provider";
import MarketplacePageContent from "./view";
import { Template } from "@my-project/shared";
import { matchFunctions, defaultValues } from "./constants";

export default function MarketplacePage() {
  return (
    <ViewModeContextProvider entityID={"marketplace"}>
      <FilterProvider<Template, typeof defaultValues>
        defaultValues={defaultValues}
        matchFunctions={matchFunctions}
        syncWithUrl
      >
        <MarketplacePageContent />
      </FilterProvider>
    </ViewModeContextProvider>
  );
}
