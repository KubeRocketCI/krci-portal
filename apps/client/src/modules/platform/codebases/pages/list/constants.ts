import { CODEBASE_TYPE } from "@/core/k8s/constants/codebaseTypes";
import { MatchFunctions } from "./types";

export const codebaseListFilterControlNames = {
  CODEBASE_TYPE: "codebaseType",
} as const;

export const matchFunctions: MatchFunctions = {
  [codebaseListFilterControlNames.CODEBASE_TYPE]: (item, value) => {
    if (value === CODEBASE_TYPE.ALL) {
      return true;
    }

    if (Array.isArray(value)) {
      return value.includes(item.spec.type);
    }
    return item.spec.type === value;
  },
};
