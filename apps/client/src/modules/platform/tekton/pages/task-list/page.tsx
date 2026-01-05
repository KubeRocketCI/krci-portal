import { FilterProvider } from "@/core/providers/Filter";
import { Task } from "@my-project/shared";
import { TaskListFilterValues } from "./components/TaskFilter/types";
import { taskFilterDefaultValues, matchFunctions } from "./components/TaskFilter/constants";
import PageView from "./view";

export default function TaskListPage() {
  return (
    <FilterProvider<Task, TaskListFilterValues>
      defaultValues={taskFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <PageView />
    </FilterProvider>
  );
}
