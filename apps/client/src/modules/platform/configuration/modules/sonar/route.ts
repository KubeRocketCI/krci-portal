import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_SONAR = "sonar" as const;
export const PATH_CONFIG_SONAR_FULL = "/c/$clusterName/configuration/sonar" as const;

export const routeSonarConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_SONAR,
  head: () => ({
    meta: [{ title: "SonarQube Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
