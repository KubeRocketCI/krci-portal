import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TASK_DETAILS } from "./route";
import TaskDetailsPage from "./page";

const TaskDetailsRoute = createLazyRoute(ROUTE_ID_TASK_DETAILS)({
  component: TaskDetailsPage,
});

export default TaskDetailsRoute;
