import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeDefectdojoConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/defectdojo",
}).lazy(() => import("./route.lazy").then((res) => res.default));
