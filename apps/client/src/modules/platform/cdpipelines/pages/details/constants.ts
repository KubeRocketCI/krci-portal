import { StageWithApplication } from "@/core/k8s/api/groups/KRCI/Stage/utils/combineStageWithApplications";
import { FilterFunction } from "@/core/providers/Filter/types";
import { ValueOf } from "@/core/types/global";
import { getApplicationStatus } from "@my-project/shared";

export const stagesFilterControlNames = {
  APPLICATION: "application",
  STAGES: "stages",
  HEALTH: "health",
} as const;

export type CDPipelineDetailsFilterControlNames = ValueOf<typeof stagesFilterControlNames>;

export type MatchFunctions = Record<CDPipelineDetailsFilterControlNames, FilterFunction<StageWithApplication>>;

export type CDPipelineDetailsFilterValueMap = {
  stages: string[];
  applications: string[];
  health: string;
};

export const matchFunctions: MatchFunctions = {
  [stagesFilterControlNames.STAGES]: (item, value) => {
    if (!Array.isArray(value) || !value.length) {
      return true;
    }

    return value.includes(item.stage.spec.name);
  },
  [stagesFilterControlNames.APPLICATION]: () => true, // same applications exist in each stage

  [stagesFilterControlNames.HEALTH]: (item, value) => {
    return item.applications.some((app) =>
      value === "All" ? true : getApplicationStatus(app.argoApplication).status === value
    );
  },
};
