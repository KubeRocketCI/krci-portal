import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_DEFECTDOJO = "defectdojo" as const;
export const PATH_CONFIG_DEFECTDOJO_FULL = "/c/$clusterName/configuration/defectdojo" as const;
export const ROUTE_ID_CONFIG_DEFECTDOJO = "/_layout/c/$clusterName/configuration/defectdojo" as const;

export const routeDefectdojoConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_DEFECTDOJO,
  head: () => ({
    meta: [{ title: "DefectDojo Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
