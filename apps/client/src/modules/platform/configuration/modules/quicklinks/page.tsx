import { FilterProvider } from "@/core/providers/Filter/provider";
import { ResourceActionListContextProvider } from "@/core/providers/ResourceActionList/provider";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import PageView from "./view";

export default function QuickLinkListPage() {
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  return (
    <ResourceActionListContextProvider>
      <FilterProvider entityID={`QUICK_LINK_LIST::${defaultNamespace}`} matchFunctions={{}} saveToLocalStorage>
        <PageView />
      </FilterProvider>
    </ResourceActionListContextProvider>
  );
}
