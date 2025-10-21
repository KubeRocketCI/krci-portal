import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_PIPELINES = "pipelines" as const;
export const PATH_PIPELINES_FULL = "/c/$clusterName/cicd/pipelines" as const;

export const routePipelineList = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_PIPELINES,
  head: () => ({
    meta: [{ title: "Pipelines | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
