import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_PIPELINERUNS = "pipelineruns" as const;
export const PATH_PIPELINERUNS_FULL = "/c/$clusterName/cicd/pipelineruns" as const;
export const ROUTE_ID_PIPELINERUNS = "/_layout/c/$clusterName/cicd/pipelineruns" as const;

// Filter params (search, status, pipelineType, codebases, namespaces) are read by
// FilterProvider via `useSearch({ strict: false })`, so the route schema does not
// declare them. The page no longer paginates client-side, so legacy
// `page` / `rowsPerPage` params are stripped from the URL on mount inside Pipelines.
export type Search = Record<string, unknown>;

export const routePipelineRunList = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_PIPELINERUNS,
  validateSearch: (search: Record<string, unknown>): Search => search,
  head: () => ({
    meta: [{ title: "Pipeline Runs | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((m) => m.Route));
