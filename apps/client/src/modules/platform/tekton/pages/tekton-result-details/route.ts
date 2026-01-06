import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TEKTON_RESULT_PIPELINERUN_DETAILS =
  "pipelineruns/$namespace/tekton-results/$resultUid/$recordUid" as const;
export const PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL =
  "/c/$clusterName/cicd/pipelineruns/$namespace/tekton-results/$resultUid/$recordUid" as const;

export const routeSearchTabSchema = z.enum(["overview", "details", "yaml"]);
export const routeSearchTabName = routeSearchTabSchema.enum;

export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;

export interface Search {
  tab?: RouteSearchTab;
}

export const routeTektonResultPipelineRunDetails = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_TEKTON_RESULT_PIPELINERUN_DETAILS,
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = z
      .object({
        tab: routeSearchTabSchema.optional(),
      })
      .parse(search);

    return {
      tab: parsed.tab ?? "overview",
    };
  },
  head: ({ params }) => ({
    meta: [{ title: `Tekton Result: ${params.recordUid.slice(0, 8)}... [${params.namespace}] — Pipeline Runs | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
