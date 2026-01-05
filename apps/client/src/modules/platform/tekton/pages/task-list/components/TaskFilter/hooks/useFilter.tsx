import { useFilterContext } from "@/core/providers/Filter";
import { Task } from "@my-project/shared";
import { TaskListFilterValues } from "../types";

export const useTaskFilter = () => useFilterContext<Task, TaskListFilterValues>();
