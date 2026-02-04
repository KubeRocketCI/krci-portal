import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TRIVY_CLUSTER_RBAC_ASSESSMENTS = "cluster/rbac-assessments" as const;
export const PATH_TRIVY_CLUSTER_RBAC_ASSESSMENTS_FULL = "/c/$clusterName/security/cluster/rbac-assessments" as const;
export const ROUTE_ID_TRIVY_CLUSTER_RBAC_ASSESSMENTS =
  "/_layout/c/$clusterName/security/cluster/rbac-assessments" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeTrivyClusterRbacAssessments = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_CLUSTER_RBAC_ASSESSMENTS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Cluster RBAC Assessments | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
