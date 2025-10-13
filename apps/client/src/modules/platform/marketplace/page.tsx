import { FilterProvider } from "@/core/providers/Filter/provider";
import { ViewModeContextProvider } from "@/core/providers/ViewMode/provider";
import MarketplacePageContent from "./view";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { FilterValueMap } from "@/core/providers/Filter/types";

export default function MarketplacePage() {
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  const valueMap: FilterValueMap = {
    search: "",
    codebaseType: "all",
  };

  return (
    <ViewModeContextProvider entityID={"marketplace"}>
      <FilterProvider
        entityID={`MARKETPLACE_LIST::${defaultNamespace}`}
        matchFunctions={{}}
        valueMap={valueMap}
        saveToLocalStorage
      >
        <MarketplacePageContent />
      </FilterProvider>
    </ViewModeContextProvider>
  );
}
