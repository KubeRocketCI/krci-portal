import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";

export const PATH_TRIVY_EXPOSED_SECRETS = "container/exposed-secrets" as const;
export const PATH_TRIVY_EXPOSED_SECRETS_FULL = "/c/$clusterName/security/container/exposed-secrets" as const;
export const ROUTE_ID_TRIVY_EXPOSED_SECRETS = "/_layout/c/$clusterName/security/container/exposed-secrets" as const;

// PROTOTYPE (EPMDEDP-16072): DefectDojo variant of the page. Not for main.
export const routeSearchPrototypeVariantSchema = z.enum(["A"]);
export type RouteSearchPrototypeVariant = z.infer<typeof routeSearchPrototypeVariantSchema>;

export interface Search {
  namespace?: string;
  page?: number;
  rowsPerPage?: number;
  /** Unset: the page reads Trivy custom resources. */
  variant?: RouteSearchPrototypeVariant;
  /** Prototype: comma-separated clusters. Unset: the clusters of the installation's Stages. */
  clusters?: string;
}

export const routeTrivyExposedSecrets = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_EXPOSED_SECRETS,
  validateSearch: (search: Record<string, unknown>): Search => {
    return z
      .object({
        namespace: z.string().optional(),
        page: z.number().int().positive().optional(),
        rowsPerPage: z.number().int().positive().optional(),
        variant: routeSearchPrototypeVariantSchema.optional().catch(undefined),
        clusters: z.string().optional(),
      })
      .parse(search);
  },
  head: () => ({
    meta: [{ title: "Exposed Secrets | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
