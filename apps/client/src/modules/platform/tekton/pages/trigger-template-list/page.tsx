import { FilterProvider } from "@/core/providers/Filter";
import { TriggerTemplate } from "@my-project/shared";
import { TriggerTemplateListFilterValues } from "./components/TriggerTemplateFilter/types";
import { triggerTemplateFilterDefaultValues, matchFunctions } from "./components/TriggerTemplateFilter/constants";
import PageView from "./view";

export default function TriggerTemplateListPage() {
  return (
    <FilterProvider<TriggerTemplate, TriggerTemplateListFilterValues>
      defaultValues={triggerTemplateFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <PageView />
    </FilterProvider>
  );
}
