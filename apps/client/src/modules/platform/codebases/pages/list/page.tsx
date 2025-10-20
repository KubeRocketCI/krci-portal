import { FilterProvider } from "@/core/providers/Filter";
import { codebaseFilterDefaultValues, matchFunctions } from "./components/CodebaseFilter/constants";
import ComponentListPageContent from "./view";
import { Codebase } from "@my-project/shared";
import { CodebaseListFilterValues } from "./components/CodebaseFilter/types";

export default function ComponentListPage() {
  return (
    <FilterProvider<Codebase, CodebaseListFilterValues>
      defaultValues={codebaseFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <ComponentListPageContent />
    </FilterProvider>
  );
}
