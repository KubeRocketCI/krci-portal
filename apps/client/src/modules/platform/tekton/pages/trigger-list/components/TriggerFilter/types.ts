import { TRIGGER_LIST_FILTER_NAMES } from "./constants";

export type TriggerListFilterValues = {
  [TRIGGER_LIST_FILTER_NAMES.SEARCH]: string;
  [TRIGGER_LIST_FILTER_NAMES.NAMESPACES]: string[];
};
