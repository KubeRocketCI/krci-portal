import { routeCICD } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TEKTON_RESULT_PIPELINERUN_DETAILS =
  "pipelineruns/$namespace/tekton-results/$resultUid/$recordUid" as const;
export const PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL =
  "/c/$clusterName/cicd/pipelineruns/$namespace/tekton-results/$resultUid/$recordUid" as const;
export const ROUTE_ID_TEKTON_RESULT_PIPELINERUN_DETAILS =
  "/_layout/c/$clusterName/cicd/pipelineruns/$namespace/tekton-results/$resultUid/$recordUid" as const;

export const routeSearchTabSchema = z.enum(["overview", "logs", "yaml"]);
export const routeSearchTabName = routeSearchTabSchema.enum;

export const routeSearchLogViewSchema = z.enum(["all", "tasks"]);
export const routeSearchLogViewName = routeSearchLogViewSchema.enum;

export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;
export type RouteSearchLogView = z.infer<typeof routeSearchLogViewSchema>;

export interface Search {
  tab?: RouteSearchTab;
  logView?: RouteSearchLogView;
  taskRun?: string;
}

export const routeTektonResultPipelineRunDetails = createRoute({
  getParentRoute: () => routeCICD,
  path: PATH_TEKTON_RESULT_PIPELINERUN_DETAILS,
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = z
      .object({
        tab: routeSearchTabSchema.optional(),
        logView: routeSearchLogViewSchema.optional(),
        taskRun: z.string().optional(),
      })
      .parse(search);

    return {
      tab: parsed.tab ?? "overview",
      logView: parsed.logView ?? "tasks",
      taskRun: parsed.taskRun,
    };
  },
  head: ({ params }) => ({
    meta: [{ title: `Tekton Result: ${params.recordUid.slice(0, 8)}... [${params.namespace}] — Pipeline Runs | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
