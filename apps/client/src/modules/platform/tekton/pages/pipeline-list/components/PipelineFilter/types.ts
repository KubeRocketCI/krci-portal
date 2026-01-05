import { FilterTypeWithOptionAll } from "@/k8s/types";
import { PipelineType } from "@my-project/shared";
import { PIPELINE_LIST_FILTER_NAMES } from "./constants";

export type PipelineListFilterValues = {
  [PIPELINE_LIST_FILTER_NAMES.SEARCH]: string;
  [PIPELINE_LIST_FILTER_NAMES.NAMESPACES]: string[];
  [PIPELINE_LIST_FILTER_NAMES.PIPELINE_TYPE]: FilterTypeWithOptionAll<PipelineType>;
};
