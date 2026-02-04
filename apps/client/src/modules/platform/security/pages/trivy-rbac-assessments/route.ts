import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TRIVY_RBAC_ASSESSMENTS = "namespace/rbac-assessments" as const;
export const PATH_TRIVY_RBAC_ASSESSMENTS_FULL = "/c/$clusterName/security/namespace/rbac-assessments" as const;
export const ROUTE_ID_TRIVY_RBAC_ASSESSMENTS = "/_layout/c/$clusterName/security/namespace/rbac-assessments" as const;

export interface Search {
  namespace?: string;
  page?: number;
  rowsPerPage?: number;
}

export const routeTrivyRbacAssessments = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_RBAC_ASSESSMENTS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        namespace: z.string().optional(),
        page: z.number().optional(),
        rowsPerPage: z.number().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "RBAC Assessments | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
