import { MatchFunctions } from "@/core/providers/Filter";
import { Task } from "@my-project/shared";
import { TaskListFilterValues } from "./types";
import { createSearchMatchFunction } from "@/core/providers/Filter";

export const TASK_LIST_FILTER_NAMES = {
  SEARCH: "search",
  NAMESPACES: "namespaces",
} as const;

export const taskFilterDefaultValues: TaskListFilterValues = {
  [TASK_LIST_FILTER_NAMES.SEARCH]: "",
  [TASK_LIST_FILTER_NAMES.NAMESPACES]: [],
};

export const matchFunctions: MatchFunctions<Task, TaskListFilterValues> = {
  [TASK_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<Task>(),
  [TASK_LIST_FILTER_NAMES.NAMESPACES]: (item, value) => {
    const arrayValue = Array.isArray(value) ? value : value ? [value] : [];
    if (arrayValue.length === 0) return true;
    return arrayValue.includes(item.metadata.namespace!);
  },
};
