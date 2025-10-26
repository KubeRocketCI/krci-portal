import { CDPIPELINE_LIST_FILTER_NAMES } from "./constants";

export type CDPipelineFilterValues = {
  [CDPIPELINE_LIST_FILTER_NAMES.SEARCH]: string;
  [CDPIPELINE_LIST_FILTER_NAMES.CODEBASES]: string[];
  [CDPIPELINE_LIST_FILTER_NAMES.NAMESPACES]: string[];
};
