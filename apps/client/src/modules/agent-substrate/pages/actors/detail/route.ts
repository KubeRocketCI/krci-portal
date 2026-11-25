import { createRoute } from "@tanstack/react-router";
import { routeFactoryMode } from "@/core/router/routes";
import { PATH_FACTORY_ACTOR_DETAIL } from "../../../constants/paths";
import { actorDetailTabSchema } from "../../../constants/tabs";

export const ROUTE_ID_FACTORY_ACTOR_DETAIL = "/_layout/c/$clusterName/factory/actors/$atespace/$name" as const;

export const routeFactoryActorDetail = createRoute({
  getParentRoute: () => routeFactoryMode,
  path: PATH_FACTORY_ACTOR_DETAIL,
  validateSearch: (search: Record<string, unknown>) => actorDetailTabSchema.parse(search),
  head: () => ({ meta: [{ title: "Actor | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
