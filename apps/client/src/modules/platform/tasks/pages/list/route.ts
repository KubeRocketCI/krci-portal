import { routeCICD } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeTaskList = createRoute({
  getParentRoute: () => routeCICD,
  path: "/tasks",
}).lazy(() => import("./route.lazy").then((res) => res.default));
