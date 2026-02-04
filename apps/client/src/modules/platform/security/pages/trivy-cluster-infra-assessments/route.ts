import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TRIVY_CLUSTER_INFRA_ASSESSMENTS = "cluster/infra-assessments" as const;
export const PATH_TRIVY_CLUSTER_INFRA_ASSESSMENTS_FULL = "/c/$clusterName/security/cluster/infra-assessments" as const;
export const ROUTE_ID_TRIVY_CLUSTER_INFRA_ASSESSMENTS =
  "/_layout/c/$clusterName/security/cluster/infra-assessments" as const;

export interface Search {
  page?: number;
  rowsPerPage?: number;
}

export const routeTrivyClusterInfraAssessments = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_CLUSTER_INFRA_ASSESSMENTS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Cluster Infrastructure Assessments | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
