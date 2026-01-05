import { useFilterContext } from "@/core/providers/Filter";
import type { PipelineRunListFilterValues } from "../types";
import { PipelineRun } from "@my-project/shared";

export const usePipelineRunFilter = () => useFilterContext<PipelineRun, PipelineRunListFilterValues>();
