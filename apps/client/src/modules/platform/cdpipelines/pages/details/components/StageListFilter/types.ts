import { stagesFilterControlNames } from "./constants";

export type StageFilterValues = {
  [stagesFilterControlNames.STAGES]: string[];
  [stagesFilterControlNames.APPLICATION]: string[];
  [stagesFilterControlNames.HEALTH]: string;
};
