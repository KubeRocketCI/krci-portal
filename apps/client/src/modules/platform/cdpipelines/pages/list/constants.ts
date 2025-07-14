import { MatchFunctions } from "./types";

export const cdPipelineFilterControlNames = {
  CODEBASES: "codebases",
} as const;

export const matchFunctions: MatchFunctions = {
  [cdPipelineFilterControlNames.CODEBASES]: (item, value) => {
    const arrayValue = Array.isArray(value) ? value : value ? [value] : [];
    if (arrayValue.length === 0) return true;
    return Array.isArray(item.spec.applications)
      ? item.spec.applications.some((app) => arrayValue.includes(app))
      : false;
  },
};
