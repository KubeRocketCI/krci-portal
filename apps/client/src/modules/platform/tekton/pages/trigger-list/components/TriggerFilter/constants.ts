import { MatchFunctions, createSearchMatchFunction, createNamespaceMatchFunction } from "@/core/providers/Filter";
import { Trigger } from "@my-project/shared";
import { TriggerListFilterValues } from "./types";

export const TRIGGER_LIST_FILTER_NAMES = {
  SEARCH: "search",
  NAMESPACES: "namespaces",
} as const;

export const triggerFilterDefaultValues: TriggerListFilterValues = {
  [TRIGGER_LIST_FILTER_NAMES.SEARCH]: "",
  [TRIGGER_LIST_FILTER_NAMES.NAMESPACES]: [],
};

export const matchFunctions: MatchFunctions<Trigger, TriggerListFilterValues> = {
  [TRIGGER_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<Trigger>(),
  [TRIGGER_LIST_FILTER_NAMES.NAMESPACES]: createNamespaceMatchFunction<Trigger>(),
};
