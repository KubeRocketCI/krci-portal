import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeComponentList = createRoute({
  getParentRoute: () => routeCluster,
  path: "components",
}).lazy(() => import("./route.lazy").then((res) => res.default));
