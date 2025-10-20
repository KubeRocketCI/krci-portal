import { MatchFunctions } from "@/core/providers/Filter";
import { Task } from "@my-project/shared";
import { TaskListFilterValues } from "./types";
import { createSearchMatchFunction } from "@/core/providers/Filter";

export const TASK_LIST_FILTER_NAMES = {
  SEARCH: "search",
} as const;

export const taskFilterDefaultValues: TaskListFilterValues = {
  [TASK_LIST_FILTER_NAMES.SEARCH]: "",
};

export const matchFunctions: MatchFunctions<Task, TaskListFilterValues> = {
  [TASK_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<Task>(),
};
