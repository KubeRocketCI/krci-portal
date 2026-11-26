import { routeSecurity } from "@/core/router/routes";
import { DEFECTDOJO_LEVELS } from "@my-project/shared";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import { k8sNameSearchParam } from "@/core/router/searchParams";
import { platformListSearchParams } from "@/modules/platform/security/components/defectdojo/searchParams";

/** "trivy": the sidebar, pinned items and links store this path. */
export const PATH_SECURITY_OVERVIEW = "trivy" as const;
export const PATH_SECURITY_OVERVIEW_FULL = "/c/$clusterName/security/trivy" as const;
export const ROUTE_ID_SECURITY_OVERVIEW = "/_layout/c/$clusterName/security/trivy" as const;

export const OVERVIEW_TABS = ["namespaces", "codebases"] as const;

export type OverviewTab = (typeof OVERVIEW_TABS)[number];

export const securityOverviewSearchSchema = z.object({
  level: z.enum(DEFECTDOJO_LEVELS).optional().catch(undefined),
  cluster: platformListSearchParams.cluster,
  namespace: platformListSearchParams.namespace,
  /** An Environment, by its CDPipeline and the `spec.name` of its Stage, as the Stage page names it. */
  cdPipeline: k8sNameSearchParam,
  stage: k8sNameSearchParam,
  codebase: platformListSearchParams.codebase,
  severity: platformListSearchParams.severity,
  state: platformListSearchParams.state,
  tab: z.enum(OVERVIEW_TABS).optional().catch(undefined),
});

export type Search = z.infer<typeof securityOverviewSearchSchema>;

export const routeSecurityOverview = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_SECURITY_OVERVIEW,
  validateSearch: (search: Record<string, unknown>): Search => securityOverviewSearchSchema.parse(search),
  head: () => ({
    meta: [{ title: "Security Overview | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
