import { FilterProvider } from "@/core/providers/Filter/provider";
import ComponentListPageContent from "./view";
import { useClusterStore } from "@/core/store";
import { useShallow } from "zustand/react/shallow";
import { matchFunctions } from "./constants";
import { ComponentListFilterValueMap } from "./types";

export default function ComponentListPage() {
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  const valueMap: ComponentListFilterValueMap = {
    search: "",
    codebaseType: "all",
  };

  return (
    <FilterProvider
      entityID={`CODEBASE_LIST::${defaultNamespace}`}
      matchFunctions={matchFunctions}
      valueMap={valueMap}
      saveToLocalStorage
    >
      <ComponentListPageContent />
    </FilterProvider>
  );
}
