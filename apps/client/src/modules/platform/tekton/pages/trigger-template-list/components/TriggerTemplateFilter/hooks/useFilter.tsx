import { useFilterContext } from "@/core/providers/Filter";
import { TriggerTemplate } from "@my-project/shared";
import { TriggerTemplateListFilterValues } from "../types";

export function useTriggerTemplateFilter() {
  return useFilterContext<TriggerTemplate, TriggerTemplateListFilterValues>();
}
