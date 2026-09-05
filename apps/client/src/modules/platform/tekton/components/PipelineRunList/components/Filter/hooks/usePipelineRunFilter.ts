import { useFilterContext } from "@/core/providers/Filter";
import type { PipelineRunListFilterValues } from "../types";
import type { PipelineRunStatusFilterValue } from "@/modules/platform/tekton/utils/pipelineRunStatusFilter";
import { PipelineRun } from "@my-project/shared";
import { useStore } from "@tanstack/react-form";
import { useDebouncedValue } from "@/core/hooks/useDebouncedValue";

export const usePipelineRunFilter = () => useFilterContext<PipelineRun, PipelineRunListFilterValues>();

export const useDebouncedPipelineRunSearch = () => {
  const { form } = usePipelineRunFilter();
  const searchTerm = useStore(form.store, (state) => state.values.search);
  return useDebouncedValue(searchTerm, 300);
};

/** Current Status filter value from the PipelineRun filter form. */
export const useSelectedPipelineRunStatus = (): PipelineRunStatusFilterValue => {
  const { form } = usePipelineRunFilter();
  return useStore(form.store, (state) => state.values.status);
};
