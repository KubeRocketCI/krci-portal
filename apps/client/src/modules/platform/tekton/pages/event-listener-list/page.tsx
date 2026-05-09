import { FilterProvider } from "@/core/providers/Filter";
import { EventListener } from "@my-project/shared";
import { EventListenerListFilterValues } from "./components/EventListenerFilter/types";
import { eventListenerFilterDefaultValues, matchFunctions } from "./components/EventListenerFilter/constants";
import PageView from "./view";

export default function EventListenerListPage() {
  return (
    <FilterProvider<EventListener, EventListenerListFilterValues>
      defaultValues={eventListenerFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <PageView />
    </FilterProvider>
  );
}
