import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TRIVY_CLUSTER_VULNERABILITIES = "cluster/vulnerabilities" as const;
export const PATH_TRIVY_CLUSTER_VULNERABILITIES_FULL = "/c/$clusterName/security/cluster/vulnerabilities" as const;
export const ROUTE_ID_TRIVY_CLUSTER_VULNERABILITIES =
  "/_layout/c/$clusterName/security/cluster/vulnerabilities" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeTrivyClusterVulnerabilities = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_CLUSTER_VULNERABILITIES,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Cluster Vulnerability Reports | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
