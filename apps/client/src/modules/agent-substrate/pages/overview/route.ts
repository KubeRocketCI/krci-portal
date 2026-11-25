import { createRoute } from "@tanstack/react-router";
import { routeFactoryMode } from "@/core/router/routes";
import { PATH_FACTORY_OVERVIEW } from "../../constants/paths";

export const ROUTE_ID_FACTORY_OVERVIEW = "/_layout/c/$clusterName/factory/overview" as const;

export const routeFactoryOverview = createRoute({
  getParentRoute: () => routeFactoryMode,
  path: PATH_FACTORY_OVERVIEW,
  head: () => ({ meta: [{ title: "Fleet Overview | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
