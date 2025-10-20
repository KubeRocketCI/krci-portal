import { MatchFunctions } from "@/core/providers/Filter";
import { Pipeline } from "@my-project/shared";
import { PipelineListFilterValues } from "./types";
import { createSearchMatchFunction } from "@/core/providers/Filter";

export const PIPELINE_LIST_FILTER_NAMES = {
  SEARCH: "search",
} as const;

export const pipelineFilterDefaultValues: PipelineListFilterValues = {
  [PIPELINE_LIST_FILTER_NAMES.SEARCH]: "",
};

export const matchFunctions: MatchFunctions<Pipeline, PipelineListFilterValues> = {
  [PIPELINE_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<Pipeline>(),
};
