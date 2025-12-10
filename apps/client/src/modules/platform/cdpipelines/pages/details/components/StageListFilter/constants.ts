import { MatchFunctions } from "@/core/providers/Filter";
import { Stage } from "@my-project/shared";
import { StageFilterValues } from "./types";

export const stagesFilterControlNames = {
  STAGES: "stages",
} as const;

export const stageFilterDefaultValues: StageFilterValues = {
  stages: [],
};

export const matchFunctions: MatchFunctions<Stage, StageFilterValues> = {
  [stagesFilterControlNames.STAGES]: (item: Stage, value: string[]) => {
    if (!Array.isArray(value) || value.length === 0) return true;
    return value.includes(item.spec.name);
  },
};
