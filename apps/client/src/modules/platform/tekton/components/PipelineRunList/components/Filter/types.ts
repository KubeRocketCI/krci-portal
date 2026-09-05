import type { ValueOf } from "@/core/types/global";
import { pipelineRunFilterControlNames } from "./constants";
import { PipelineType } from "@my-project/shared";
import { FilterTypeWithOptionAll } from "@/k8s/types";
import type { PipelineRunStatusFilterValue } from "@/modules/platform/tekton/utils/pipelineRunStatusFilter";

export type PipelineRunFilterNames = ValueOf<typeof pipelineRunFilterControlNames>;

export type PipelineRunListFilterValues = {
  [pipelineRunFilterControlNames.SEARCH]: string;
  [pipelineRunFilterControlNames.CODEBASES]: string[];
  [pipelineRunFilterControlNames.CODEBASE_BRANCHES]: string[];
  [pipelineRunFilterControlNames.STATUS]: PipelineRunStatusFilterValue;
  [pipelineRunFilterControlNames.PIPELINE_TYPE]: FilterTypeWithOptionAll<PipelineType>;
  [pipelineRunFilterControlNames.NAMESPACES]: string[];
};
