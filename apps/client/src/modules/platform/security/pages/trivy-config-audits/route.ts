import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TRIVY_CONFIG_AUDITS = "namespace/config-audits" as const;
export const PATH_TRIVY_CONFIG_AUDITS_FULL = "/c/$clusterName/security/namespace/config-audits" as const;
export const ROUTE_ID_TRIVY_CONFIG_AUDITS = "/_layout/c/$clusterName/security/namespace/config-audits" as const;

export interface Search {
  namespace?: string;
  page?: number;
  rowsPerPage?: number;
}

export const routeTrivyConfigAudits = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_CONFIG_AUDITS,
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
    meta: [{ title: "Configuration Audits | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
