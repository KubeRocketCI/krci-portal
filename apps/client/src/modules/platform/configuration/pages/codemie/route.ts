import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeCodemieConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/codemie",
}).lazy(() => import("./route.lazy").then((res) => res.default));
