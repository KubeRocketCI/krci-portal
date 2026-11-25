import { routeSecurity } from "@/core/router/routes";
import { k8sNameSearchParam } from "@/core/router/searchParams";
import {
  DEFECTDOJO_FINDING_STATES,
  DEFECTDOJO_LEVELS,
  DEFECTDOJO_SEVERITIES,
  componentSearchSchema,
  findingClustersSchema,
  vulnerabilityIdSchema,
} from "@my-project/shared";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import { VULNERABILITIES_PAGE_SIZES } from "./constants";

/** "trivy/vulnerabilities": pinned items and links store this path. */
export const PATH_VULNERABILITIES = "trivy/vulnerabilities" as const;
export const PATH_VULNERABILITIES_FULL = "/c/$clusterName/security/trivy/vulnerabilities" as const;
export const ROUTE_ID_VULNERABILITIES = "/_layout/c/$clusterName/security/trivy/vulnerabilities" as const;

export const vulnerabilitiesSearchSchema = z.object({
  level: z.enum(DEFECTDOJO_LEVELS).optional().catch(undefined),
  /** One cluster, or repeated (an array). Left out: the server's default, the Stage clusters or every cluster. */
  cluster: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : [value]))
    .pipe(findingClustersSchema)
    .optional()
    .catch(undefined),
  /** The namespace of the workloads, in each of the clusters. */
  namespace: k8sNameSearchParam,
  codebase: k8sNameSearchParam,
  severity: z.enum(DEFECTDOJO_SEVERITIES).optional().catch(undefined),
  state: z.enum(DEFECTDOJO_FINDING_STATES).optional().catch(undefined),
  vulnerabilityId: z.coerce.string().pipe(vulnerabilityIdSchema).optional().catch(undefined),
  component: z.coerce.string().pipe(componentSearchSchema).optional().catch(undefined),
  page: z.number().int().positive().optional().catch(undefined),
  rowsPerPage: z
    .number()
    .int()
    .refine((size) => VULNERABILITIES_PAGE_SIZES.includes(size))
    .optional()
    .catch(undefined),
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
