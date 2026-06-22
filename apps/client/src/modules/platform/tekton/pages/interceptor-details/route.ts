import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_INTERCEPTOR_DETAILS = "webhook-triggers/interceptors/$namespace/$name" as const;
export const PATH_INTERCEPTOR_DETAILS_FULL =
  "/c/$clusterName/configuration/webhook-triggers/interceptors/$namespace/$name" as const;
export const ROUTE_ID_INTERCEPTOR_DETAILS =
  "/_layout/c/$clusterName/configuration/webhook-triggers/interceptors/$namespace/$name" as const;

export const routeSearchTabSchema = z.enum(["overview", "yaml"]);
export const routeSearchTabName = routeSearchTabSchema.enum;
export type RouteSearchTab = z.infer<typeof routeSearchTabSchema>;

export interface Search {
  tab?: RouteSearchTab;
}

export const routeInterceptorDetails = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_INTERCEPTOR_DETAILS,
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed = z.object({ tab: routeSearchTabSchema.optional() }).parse(search);
    return { tab: parsed.tab ?? "overview" };
  },
  head: ({ params }) => ({ meta: [{ title: `${params.name} [${params.namespace}] — Interceptors | KRCI` }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
