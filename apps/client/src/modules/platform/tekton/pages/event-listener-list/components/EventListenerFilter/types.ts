import { EVENT_LISTENER_LIST_FILTER_NAMES } from "./constants";

export type EventListenerListFilterValues = {
  [EVENT_LISTENER_LIST_FILTER_NAMES.SEARCH]: string;
  [EVENT_LISTENER_LIST_FILTER_NAMES.NAMESPACES]: string[];
};
