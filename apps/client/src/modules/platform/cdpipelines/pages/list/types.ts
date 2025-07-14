import { CDPipeline } from "@my-project/shared";
import { cdPipelineFilterControlNames } from "./constants";
import { FilterFunction } from "@/core/providers/Filter/types";
import { ValueOf } from "@/core/types/global";

export type CDPipelineListFilterControlNames = ValueOf<typeof cdPipelineFilterControlNames> | "search";

export type MatchFunctions = Record<CDPipelineListFilterControlNames, FilterFunction<CDPipeline>>;

export type CDPipelineListFilterValueMap = {
  search: string;
  codebases: string[];
};
