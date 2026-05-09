import { useFilterContext } from "@/core/providers/Filter";
import { Task } from "@my-project/shared";
import { TaskListFilterValues } from "../types";

export function useTaskFilter() {
  return useFilterContext<Task, TaskListFilterValues>();
}
