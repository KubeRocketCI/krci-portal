import { createRoute, redirect } from "@tanstack/react-router";
import { routeFactoryMode } from "@/core/router/routes";
import { PATH_FACTORY_ACTORS, PATH_FACTORY_AGENTS_FULL } from "../../../constants/paths";
import { agentsSearchOfActorsUrl } from "../../../utils/agentsSearchOfActorsUrl";

export const ROUTE_ID_FACTORY_ACTORS = "/_layout/c/$clusterName/factory/actors" as const;

export const routeFactoryActors = createRoute({
  getParentRoute: () => routeFactoryMode,
  path: PATH_FACTORY_ACTORS,
  head: () => ({ meta: [{ title: "Actors | KRCI" }] }),
  beforeLoad: ({ location, params }) => {
    const agentsSearch = agentsSearchOfActorsUrl(location.searchStr);
    if (agentsSearch) {
      throw redirect({ to: PATH_FACTORY_AGENTS_FULL, params, search: agentsSearch, replace: true });
    }
  },
}).lazy(() => import("./route.lazy").then((res) => res.default));
