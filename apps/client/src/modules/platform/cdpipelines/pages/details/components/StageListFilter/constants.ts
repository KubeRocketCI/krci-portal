import { MatchFunctions } from "@/core/providers/Filter";
import { StageWithApplication } from "@/k8s/api/groups/KRCI/Stage/utils/combineStageWithApplications";
import { StageFilterValues } from "./types";
import { getApplicationStatus } from "@my-project/shared";

export const stagesFilterControlNames = {
  APPLICATION: "application",
  STAGES: "stages",
  HEALTH: "health",
} as const;

export const stageFilterDefaultValues: StageFilterValues = { stages: [], application: [], health: "All" };

export const matchFunctions: MatchFunctions<StageWithApplication, StageFilterValues> = {
  [stagesFilterControlNames.STAGES]: (item: StageWithApplication, value: string[]) => {
    if (!Array.isArray(value) || value.length === 0) return true;
    return value.includes(item.stage.spec.name);
  },
  [stagesFilterControlNames.APPLICATION]: () => true,
  [stagesFilterControlNames.HEALTH]: (item: StageWithApplication, value: string) => {
    return item.applications.some((app) =>
      value === "All" ? true : getApplicationStatus(app.argoApplication).status === value
    );
  },
};
