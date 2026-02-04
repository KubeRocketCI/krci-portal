import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TRIVY_EXPOSED_SECRETS = "container/exposed-secrets" as const;
export const PATH_TRIVY_EXPOSED_SECRETS_FULL = "/c/$clusterName/security/container/exposed-secrets" as const;
export const ROUTE_ID_TRIVY_EXPOSED_SECRETS = "/_layout/c/$clusterName/security/container/exposed-secrets" as const;

export interface Search {
  namespace?: string;
  page?: number;
  rowsPerPage?: number;
}

export const routeTrivyExposedSecrets = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_EXPOSED_SECRETS,
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
    meta: [{ title: "Exposed Secrets | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
