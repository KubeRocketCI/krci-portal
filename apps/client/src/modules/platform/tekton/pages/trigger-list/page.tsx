import { FilterProvider } from "@/core/providers/Filter";
import { Trigger } from "@my-project/shared";
import { TriggerListFilterValues } from "./components/TriggerFilter/types";
import { triggerFilterDefaultValues, matchFunctions } from "./components/TriggerFilter/constants";
import PageView from "./view";

export default function TriggerListPage() {
  return (
    <FilterProvider<Trigger, TriggerListFilterValues>
      defaultValues={triggerFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <PageView />
    </FilterProvider>
  );
}
