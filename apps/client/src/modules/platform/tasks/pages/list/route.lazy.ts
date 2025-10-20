import { createLazyRoute } from "@tanstack/react-router";
import TaskListPage from "./page";

const TaskListRoute = createLazyRoute("/c/$clusterName/cicd/tasks")({
  component: TaskListPage,
});

export default TaskListRoute;
