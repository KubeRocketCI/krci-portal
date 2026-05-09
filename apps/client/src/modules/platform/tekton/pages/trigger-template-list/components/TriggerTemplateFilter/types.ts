import { TRIGGER_TEMPLATE_LIST_FILTER_NAMES } from "./constants";

export type TriggerTemplateListFilterValues = {
  [TRIGGER_TEMPLATE_LIST_FILTER_NAMES.SEARCH]: string;
  [TRIGGER_TEMPLATE_LIST_FILTER_NAMES.NAMESPACES]: string[];
};
