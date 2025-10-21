import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_JIRA = "jira" as const;
export const PATH_CONFIG_JIRA_FULL = "/c/$clusterName/configuration/jira" as const;

export const routeJiraConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_JIRA,
  head: () => ({
    meta: [{ title: "Jira Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
