import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TASKS } from "./route";
import TaskListPage from "./page";

const TaskListRoute = createLazyRoute(ROUTE_ID_TASKS)({
  component: TaskListPage,
});

export default TaskListRoute;
