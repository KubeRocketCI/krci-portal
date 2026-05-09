import { useFilterContext } from "@/core/providers/Filter";
import { EventListener } from "@my-project/shared";
import { EventListenerListFilterValues } from "../types";

export function useEventListenerFilter() {
  return useFilterContext<EventListener, EventListenerListFilterValues>();
}
