import { routeCICD } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routePipelineList = createRoute({
  getParentRoute: () => routeCICD,
  path: "/pipelines",
}).lazy(() => import("./route.lazy").then((res) => res.default));
