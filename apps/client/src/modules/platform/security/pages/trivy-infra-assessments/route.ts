import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TRIVY_INFRA_ASSESSMENTS = "namespace/infra-assessments" as const;
export const PATH_TRIVY_INFRA_ASSESSMENTS_FULL = "/c/$clusterName/security/namespace/infra-assessments" as const;
export const ROUTE_ID_TRIVY_INFRA_ASSESSMENTS = "/_layout/c/$clusterName/security/namespace/infra-assessments" as const;

export interface Search {
  namespace?: string;
  page?: number;
  rowsPerPage?: number;
}

export const routeTrivyInfraAssessments = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_INFRA_ASSESSMENTS,
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
    meta: [{ title: "Infrastructure Assessments | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
