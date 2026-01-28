import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TRIVY_CONFIG_AUDIT_DETAILS = "namespace/config-audits/$namespace/$name" as const;
export const PATH_TRIVY_CONFIG_AUDIT_DETAILS_FULL =
  "/c/$clusterName/security/namespace/config-audits/$namespace/$name" as const;
export const ROUTE_ID_TRIVY_CONFIG_AUDIT_DETAILS =
  "/_layout/c/$clusterName/security/namespace/config-audits/$namespace/$name" as const;

export const routeTrivyConfigAuditDetails = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_CONFIG_AUDIT_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `Configuration Audit - ${params.name} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
