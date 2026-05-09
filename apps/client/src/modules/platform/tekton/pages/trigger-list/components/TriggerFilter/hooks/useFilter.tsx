import { useFilterContext } from "@/core/providers/Filter";
import { Trigger } from "@my-project/shared";
import { TriggerListFilterValues } from "../types";

export function useTriggerFilter() {
  return useFilterContext<Trigger, TriggerListFilterValues>();
}
