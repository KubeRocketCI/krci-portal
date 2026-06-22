import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_INTERCEPTORS = "webhook-triggers/interceptors" as const;
export const PATH_INTERCEPTORS_FULL = "/c/$clusterName/configuration/webhook-triggers/interceptors" as const;
export const ROUTE_ID_INTERCEPTORS = "/_layout/c/$clusterName/configuration/webhook-triggers/interceptors" as const;

export type Search = Record<string, unknown>;

export const routeInterceptorList = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_INTERCEPTORS,
  validateSearch: (search: Record<string, unknown>): Search => search,
  head: () => ({ meta: [{ title: "Interceptors | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
