import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TASKS = "tasks" as const;
export const PATH_TASKS_FULL = "/c/$clusterName/cicd/tasks" as const;
export const ROUTE_ID_TASKS = "/_layout/c/$clusterName/cicd/tasks" as const;

export const routeTaskList = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_TASKS,
  head: () => ({
    meta: [{ title: "Tasks | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
