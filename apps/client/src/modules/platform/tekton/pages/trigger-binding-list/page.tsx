import { FilterProvider } from "@/core/providers/Filter";
import { TriggerBinding } from "@my-project/shared";
import { TriggerBindingListFilterValues } from "./components/TriggerBindingFilter/types";
import { triggerBindingFilterDefaultValues, matchFunctions } from "./components/TriggerBindingFilter/constants";
import PageView from "./view";

export default function TriggerBindingListPage() {
  return (
    <FilterProvider<TriggerBinding, TriggerBindingListFilterValues>
      defaultValues={triggerBindingFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <PageView />
    </FilterProvider>
  );
}
