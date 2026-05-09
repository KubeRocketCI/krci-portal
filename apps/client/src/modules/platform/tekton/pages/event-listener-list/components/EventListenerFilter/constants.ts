import { MatchFunctions, createSearchMatchFunction, createNamespaceMatchFunction } from "@/core/providers/Filter";
import { EventListener } from "@my-project/shared";
import { EventListenerListFilterValues } from "./types";

export const EVENT_LISTENER_LIST_FILTER_NAMES = {
  SEARCH: "search",
  NAMESPACES: "namespaces",
} as const;

export const eventListenerFilterDefaultValues: EventListenerListFilterValues = {
  [EVENT_LISTENER_LIST_FILTER_NAMES.SEARCH]: "",
  [EVENT_LISTENER_LIST_FILTER_NAMES.NAMESPACES]: [],
};

export const matchFunctions: MatchFunctions<EventListener, EventListenerListFilterValues> = {
  [EVENT_LISTENER_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<EventListener>(),
  [EVENT_LISTENER_LIST_FILTER_NAMES.NAMESPACES]: createNamespaceMatchFunction<EventListener>(),
};
