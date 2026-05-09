import { useFilterContext } from "@/core/providers/Filter";
import { Pipeline } from "@my-project/shared";
import { PipelineListFilterValues } from "../types";

export function usePipelineFilter() {
  return useFilterContext<Pipeline, PipelineListFilterValues>();
}
