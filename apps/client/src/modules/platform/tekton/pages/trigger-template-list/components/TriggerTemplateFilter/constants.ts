import { MatchFunctions, createSearchMatchFunction, createNamespaceMatchFunction } from "@/core/providers/Filter";
import { TriggerTemplate } from "@my-project/shared";
import { TriggerTemplateListFilterValues } from "./types";

export const TRIGGER_TEMPLATE_LIST_FILTER_NAMES = {
  SEARCH: "search",
  NAMESPACES: "namespaces",
} as const;

export const triggerTemplateFilterDefaultValues: TriggerTemplateListFilterValues = {
  [TRIGGER_TEMPLATE_LIST_FILTER_NAMES.SEARCH]: "",
  [TRIGGER_TEMPLATE_LIST_FILTER_NAMES.NAMESPACES]: [],
};

export const matchFunctions: MatchFunctions<TriggerTemplate, TriggerTemplateListFilterValues> = {
  [TRIGGER_TEMPLATE_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<TriggerTemplate>(),
  [TRIGGER_TEMPLATE_LIST_FILTER_NAMES.NAMESPACES]: createNamespaceMatchFunction<TriggerTemplate>(),
};
