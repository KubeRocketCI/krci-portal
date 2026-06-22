import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_GITLABCI_PIPELINES = "gitlabci-pipelines" as const;
export const PATH_GITLABCI_PIPELINES_FULL = "/c/$clusterName/cicd/gitlabci-pipelines" as const;
export const ROUTE_ID_GITLABCI_PIPELINES = "/_layout/c/$clusterName/cicd/gitlabci-pipelines" as const;

export type Search = Record<string, unknown>;

export const routeGitLabCIPipelineList = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_GITLABCI_PIPELINES,
  validateSearch: (search: Record<string, unknown>): Search => search,
  head: () => ({
    meta: [{ title: "GitLab CI Pipelines | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
