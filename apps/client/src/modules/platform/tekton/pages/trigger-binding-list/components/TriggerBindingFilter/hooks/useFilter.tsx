import { useFilterContext } from "@/core/providers/Filter";
import { TriggerBinding } from "@my-project/shared";
import { TriggerBindingListFilterValues } from "../types";

export function useTriggerBindingFilter() {
  return useFilterContext<TriggerBinding, TriggerBindingListFilterValues>();
}
