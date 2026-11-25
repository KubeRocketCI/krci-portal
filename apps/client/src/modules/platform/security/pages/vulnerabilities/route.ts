import { routeSecurity } from "@/core/router/routes";
import { DEFECTDOJO_LEVELS, componentSearchSchema, vulnerabilityIdSchema } from "@my-project/shared";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  pageSearchParam,
  platformListSearchParams,
} from "@/modules/platform/security/components/defectdojo/searchParams";

/** "trivy/vulnerabilities": pinned items and links store this path. */
export const PATH_VULNERABILITIES = "trivy/vulnerabilities" as const;
export const PATH_VULNERABILITIES_FULL = "/c/$clusterName/security/trivy/vulnerabilities" as const;
export const ROUTE_ID_VULNERABILITIES = "/_layout/c/$clusterName/security/trivy/vulnerabilities" as const;

export const vulnerabilitiesSearchSchema = z.object({
  level: z.enum(DEFECTDOJO_LEVELS).optional().catch(undefined),
  ...platformListSearchParams,
  vulnerabilityId: z.coerce.string().pipe(vulnerabilityIdSchema).optional().catch(undefined),
  component: z.coerce.string().pipe(componentSearchSchema).optional().catch(undefined),
  page: pageSearchParam,
});

export type Search = z.infer<typeof vulnerabilitiesSearchSchema>;

export const routeVulnerabilities = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_VULNERABILITIES,
  validateSearch: (search: Record<string, unknown>): Search => vulnerabilitiesSearchSchema.parse(search),
  head: () => ({
    meta: [{ title: "Vulnerabilities | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
