import type { ValueOf } from "@/core/types/global";
import { pipelineRunFilterControlNames } from "./constants";
import { PipelineRunStatus, PipelineType } from "@my-project/shared";
import { FilterTypeWithOptionAll } from "@/k8s/types";

export type PipelineRunFilterNames = ValueOf<typeof pipelineRunFilterControlNames>;

export type PipelineRunListFilterValues = {
  [pipelineRunFilterControlNames.CODEBASES]: string[];
  [pipelineRunFilterControlNames.STATUS]: FilterTypeWithOptionAll<PipelineRunStatus>;
  [pipelineRunFilterControlNames.PIPELINE_TYPE]: FilterTypeWithOptionAll<PipelineType>;
};
