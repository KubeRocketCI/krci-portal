import { createLazyRoute } from "@tanstack/react-router";
import TaskListPage from "./view";

const TaskListRoute = createLazyRoute("/c/$clusterName/cicd/tasks")({
  component: TaskListPage,
});

export default TaskListRoute;
