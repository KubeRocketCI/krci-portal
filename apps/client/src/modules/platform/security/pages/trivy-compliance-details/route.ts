import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_TRIVY_COMPLIANCE_DETAILS = "cluster/compliance/$reportName" as const;
export const PATH_TRIVY_COMPLIANCE_DETAILS_FULL = "/c/$clusterName/security/cluster/compliance/$reportName" as const;
export const ROUTE_ID_TRIVY_COMPLIANCE_DETAILS =
  "/_layout/c/$clusterName/security/cluster/compliance/$reportName" as const;

export const routeTrivyComplianceDetails = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_TRIVY_COMPLIANCE_DETAILS,
  head: ({ params }) => ({
    meta: [{ title: `Compliance Report - ${params.reportName} | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
