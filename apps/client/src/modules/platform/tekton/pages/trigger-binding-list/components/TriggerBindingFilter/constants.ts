import { MatchFunctions, createSearchMatchFunction, createNamespaceMatchFunction } from "@/core/providers/Filter";
import { TriggerBinding } from "@my-project/shared";
import { TriggerBindingListFilterValues } from "./types";

export const TRIGGER_BINDING_LIST_FILTER_NAMES = {
  SEARCH: "search",
  NAMESPACES: "namespaces",
} as const;

export const triggerBindingFilterDefaultValues: TriggerBindingListFilterValues = {
  [TRIGGER_BINDING_LIST_FILTER_NAMES.SEARCH]: "",
  [TRIGGER_BINDING_LIST_FILTER_NAMES.NAMESPACES]: [],
};

export const matchFunctions: MatchFunctions<TriggerBinding, TriggerBindingListFilterValues> = {
  [TRIGGER_BINDING_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<TriggerBinding>(),
  [TRIGGER_BINDING_LIST_FILTER_NAMES.NAMESPACES]: createNamespaceMatchFunction<TriggerBinding>(),
};
