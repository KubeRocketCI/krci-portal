import { createRoute } from "@tanstack/react-router";
import { routeFactoryMode } from "@/core/router/routes";
import { PATH_FACTORY_AGENTS } from "../../../constants/paths";

export const ROUTE_ID_FACTORY_AGENTS = "/_layout/c/$clusterName/factory/agents" as const;

export const routeFactoryAgents = createRoute({
  getParentRoute: () => routeFactoryMode,
  path: PATH_FACTORY_AGENTS,
  head: () => ({ meta: [{ title: "Agents | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
