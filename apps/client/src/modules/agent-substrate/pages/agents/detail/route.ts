import { createRoute } from "@tanstack/react-router";
import { routeFactoryMode } from "@/core/router/routes";
import { PATH_FACTORY_AGENT_DETAIL } from "../../../constants/paths";
import { agentDetailViewSchema } from "../../../constants/tabs";

export const ROUTE_ID_FACTORY_AGENT_DETAIL = "/_layout/c/$clusterName/factory/agents/$atespace/$name" as const;

export const routeFactoryAgentDetail = createRoute({
  getParentRoute: () => routeFactoryMode,
  path: PATH_FACTORY_AGENT_DETAIL,
  validateSearch: (search: Record<string, unknown>) => agentDetailViewSchema.parse(search),
  head: () => ({ meta: [{ title: "Agent | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
