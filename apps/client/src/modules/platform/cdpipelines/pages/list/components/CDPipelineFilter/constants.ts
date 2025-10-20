import { createSearchMatchFunction, MatchFunctions } from "@/core/providers/Filter";
import { CDPipeline } from "@my-project/shared";
import { CDPipelineFilterValues } from "./types";

export const CDPIPELINE_LIST_FILTER_NAMES = {
  SEARCH: "search",
  CODEBASES: "codebases",
} as const;

export const cdPipelineFilterDefaultValues: CDPipelineFilterValues = {
  [CDPIPELINE_LIST_FILTER_NAMES.SEARCH]: "",
  [CDPIPELINE_LIST_FILTER_NAMES.CODEBASES]: [],
};

export const matchFunctions: MatchFunctions<CDPipeline, CDPipelineFilterValues> = {
  [CDPIPELINE_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<CDPipeline>(),
  [CDPIPELINE_LIST_FILTER_NAMES.CODEBASES]: (item, value) => {
    const arrayValue = Array.isArray(value) ? value : value ? [value] : [];
    if (arrayValue.length === 0) return true;
    return Array.isArray(item.spec.applications)
      ? item.spec.applications.some((app) => arrayValue.includes(app))
      : false;
  },
};
