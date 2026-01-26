import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TRIVY_OVERVIEW = "trivy" as const;
export const PATH_TRIVY_OVERVIEW_FULL = "/c/$clusterName/security/trivy" as const;
export const ROUTE_ID_TRIVY_OVERVIEW = "/_layout/c/$clusterName/security/trivy" as const;

export interface Search {
  namespace?: string;
}

export const routeTrivyOverview = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_OVERVIEW,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        namespace: z.string().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Container Scanning Overview | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
