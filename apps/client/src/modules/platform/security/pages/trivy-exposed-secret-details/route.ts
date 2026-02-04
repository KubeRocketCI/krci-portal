import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TRIVY_EXPOSED_SECRET_DETAILS = "container/exposed-secrets/$namespace/$name" as const;
export const PATH_TRIVY_EXPOSED_SECRET_DETAILS_FULL =
  "/c/$clusterName/security/container/exposed-secrets/$namespace/$name" as const;
export const ROUTE_ID_TRIVY_EXPOSED_SECRET_DETAILS =
  "/_layout/c/$clusterName/security/container/exposed-secrets/$namespace/$name" as const;

export const routeTrivyExposedSecretDetails = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_EXPOSED_SECRET_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `Exposed Secret - ${params.name} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
