import { contentLayoutRoute } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_SETTINGS_TOURS = "settings/tours" as const;
export const PATH_SETTINGS_TOURS_FULL = "/settings/tours" as const;
export const ROUTE_ID_SETTINGS_TOURS = "/_layout/settings/tours" as const;

export const routeSettingsTours = createRoute({
  getParentRoute: () => contentLayoutRoute,
  path: PATH_SETTINGS_TOURS,
  head: () => ({
    meta: [{ title: "Tours Settings | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
