import { TRIGGER_BINDING_LIST_FILTER_NAMES } from "./constants";

export type TriggerBindingListFilterValues = {
  [TRIGGER_BINDING_LIST_FILTER_NAMES.SEARCH]: string;
  [TRIGGER_BINDING_LIST_FILTER_NAMES.NAMESPACES]: string[];
};
