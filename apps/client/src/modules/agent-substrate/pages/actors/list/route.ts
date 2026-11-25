import { createRoute } from "@tanstack/react-router";
import { routeFactoryMode } from "@/core/router/routes";
import { PATH_FACTORY_ACTORS } from "../../../constants/paths";

export const ROUTE_ID_FACTORY_ACTORS = "/_layout/c/$clusterName/factory/actors" as const;

export const routeFactoryActors = createRoute({
  getParentRoute: () => routeFactoryMode,
  path: PATH_FACTORY_ACTORS,
  head: () => ({ meta: [{ title: "Actors | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
