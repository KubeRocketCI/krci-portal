import { contentLayoutRoute } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_HOME = "home" as const;
export const PATH_HOME_FULL = "/home" as const;
export const ROUTE_HOME_ID = "/_layout/home" as const;

export const routeHome = createRoute({
  getParentRoute: () => contentLayoutRoute,
  path: PATH_HOME,
  head: () => ({
    meta: [{ title: "Home | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
