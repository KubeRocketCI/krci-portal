import { MatchFunctions } from "./types";
import { Codebase } from "@my-project/shared";

export const codebaseListFilterControlNames = {
  CODEBASE_TYPE: "codebaseType",
} as const;

export const matchFunctions: MatchFunctions = {
  search: (item: Codebase, value: string | string[] | boolean) => {
    if (!value || typeof value !== "string") return true;
    return item.metadata.name.toLowerCase().includes(value.toLowerCase());
  },
  [codebaseListFilterControlNames.CODEBASE_TYPE]: (item, value) => {
    if (value === "all") {
      return true;
    }

    if (Array.isArray(value)) {
      return value.includes(item.spec.type);
    }
    return item.spec.type === value;
  },
};
