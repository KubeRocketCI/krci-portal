import { TASK_LIST_FILTER_NAMES } from "./constants";

export type TaskListFilterValues = {
  [TASK_LIST_FILTER_NAMES.SEARCH]: string;
  [TASK_LIST_FILTER_NAMES.NAMESPACES]: string[];
};
