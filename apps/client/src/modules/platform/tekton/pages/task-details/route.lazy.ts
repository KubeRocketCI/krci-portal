import { createLazyRoute } from "@tanstack/react-router";
import TaskDetailsPage from "./page";

const TaskDetailsRoute = createLazyRoute("/c/$clusterName/cicd/tasks/$namespace/$name")({
  component: TaskDetailsPage,
});

export default TaskDetailsRoute;
