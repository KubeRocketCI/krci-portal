import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TRIVY_CLUSTER_CONFIG_AUDIT_DETAILS = "cluster/config-audits/$name" as const;
export const PATH_TRIVY_CLUSTER_CONFIG_AUDIT_DETAILS_FULL =
  "/c/$clusterName/security/cluster/config-audits/$name" as const;
export const ROUTE_ID_TRIVY_CLUSTER_CONFIG_AUDIT_DETAILS =
  "/_layout/c/$clusterName/security/cluster/config-audits/$name" as const;

export const routeTrivyClusterConfigAuditDetails = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_CLUSTER_CONFIG_AUDIT_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `Cluster Configuration Audit - ${params.name} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
