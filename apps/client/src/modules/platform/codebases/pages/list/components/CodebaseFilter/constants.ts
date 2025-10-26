import { MatchFunctions } from "@/core/providers/Filter";
import { Codebase } from "@my-project/shared";
import { CodebaseListFilterValues } from "./types";
import { createSearchMatchFunction } from "@/core/providers/Filter";

export const CODEBASE_LIST_FILTER_NAMES = {
  SEARCH: "search",
  CODEBASE_TYPE: "codebaseType",
  NAMESPACES: "namespaces",
} as const;

export const codebaseFilterDefaultValues: CodebaseListFilterValues = {
  [CODEBASE_LIST_FILTER_NAMES.SEARCH]: "",
  [CODEBASE_LIST_FILTER_NAMES.CODEBASE_TYPE]: "all",
  [CODEBASE_LIST_FILTER_NAMES.NAMESPACES]: [],
};

export const matchFunctions: MatchFunctions<Codebase, CodebaseListFilterValues> = {
  [CODEBASE_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<Codebase>(),
  [CODEBASE_LIST_FILTER_NAMES.CODEBASE_TYPE]: (item, value) => {
    if (value === "all") {
      return true;
    }

    return item.spec.type === value;
  },
  [CODEBASE_LIST_FILTER_NAMES.NAMESPACES]: (item, value) => {
    const arrayValue = Array.isArray(value) ? value : value ? [value] : [];
    if (arrayValue.length === 0) return true;
    return arrayValue.includes(item.metadata.namespace!);
  },
};
