import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TRIVY_CLUSTER_CONFIG_AUDITS = "cluster/config-audits" as const;
export const PATH_TRIVY_CLUSTER_CONFIG_AUDITS_FULL = "/c/$clusterName/security/cluster/config-audits" as const;
export const ROUTE_ID_TRIVY_CLUSTER_CONFIG_AUDITS = "/_layout/c/$clusterName/security/cluster/config-audits" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeTrivyClusterConfigAudits = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_CLUSTER_CONFIG_AUDITS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Cluster Configuration Audits | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
