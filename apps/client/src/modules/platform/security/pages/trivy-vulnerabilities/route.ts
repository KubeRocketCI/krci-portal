import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TRIVY_VULNERABILITIES = "trivy/vulnerabilities" as const;
export const PATH_TRIVY_VULNERABILITIES_FULL = "/c/$clusterName/security/trivy/vulnerabilities" as const;
export const ROUTE_ID_TRIVY_VULNERABILITIES = "/_layout/c/$clusterName/security/trivy/vulnerabilities" as const;

export interface Search {
  namespace?: string;
  page?: number;
  rowsPerPage?: number;
}

export const routeTrivyVulnerabilities = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_VULNERABILITIES,
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
    meta: [{ title: "Container Vulnerability Reports | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
