import { MatchFunctions } from "@/core/providers/Filter";
import { Pipeline, pipelineLabels } from "@my-project/shared";
import { PipelineListFilterValues } from "./types";
import { createSearchMatchFunction } from "@/core/providers/Filter";

export const PIPELINE_LIST_FILTER_NAMES = {
  SEARCH: "search",
  NAMESPACES: "namespaces",
  PIPELINE_TYPE: "pipelineType",
} as const;

export const pipelineFilterDefaultValues: PipelineListFilterValues = {
  [PIPELINE_LIST_FILTER_NAMES.SEARCH]: "",
  [PIPELINE_LIST_FILTER_NAMES.NAMESPACES]: [],
  [PIPELINE_LIST_FILTER_NAMES.PIPELINE_TYPE]: "all",
};

export const matchFunctions: MatchFunctions<Pipeline, PipelineListFilterValues> = {
  [PIPELINE_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<Pipeline>(),
  [PIPELINE_LIST_FILTER_NAMES.NAMESPACES]: (item, value) => {
    const arrayValue = Array.isArray(value) ? value : value ? [value] : [];
    if (arrayValue.length === 0) return true;
    return arrayValue.includes(item.metadata.namespace!);
  },
  [PIPELINE_LIST_FILTER_NAMES.PIPELINE_TYPE]: (item, value) => {
    if (value === "all") {
      return true;
    }

    return item?.metadata?.labels?.[pipelineLabels.pipelineType] === value;
  },
};
