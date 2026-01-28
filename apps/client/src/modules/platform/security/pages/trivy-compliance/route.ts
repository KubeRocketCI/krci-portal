import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TRIVY_COMPLIANCE = "cluster/compliance" as const;
export const PATH_TRIVY_COMPLIANCE_FULL = "/c/$clusterName/security/cluster/compliance" as const;
export const ROUTE_ID_TRIVY_COMPLIANCE = "/_layout/c/$clusterName/security/cluster/compliance" as const;

export const routeTrivyCompliance = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_COMPLIANCE,
  head: () => ({
    meta: [{ title: "Cluster Compliance | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
